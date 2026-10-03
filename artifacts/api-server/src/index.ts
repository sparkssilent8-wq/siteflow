import { spawn, type ChildProcess } from "node:child_process";
import { request as httpRequest } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const apiServerRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const python = process.env["PYTHON_BIN"] || "python3";
const databasePath = join(apiServerRoot, "backend", "siteflow.db");
const pythonEnv = {
  ...process.env,
  PYTHONPATH: apiServerRoot,
  PYTHONUNBUFFERED: "1",
};

const children: ChildProcess[] = [];

function startPython(args: string[], extraEnv: Record<string, string>) {
  const child = spawn(python, args, {
    cwd: apiServerRoot,
    env: { ...pythonEnv, ...extraEnv },
    stdio: ["ignore", "inherit", "inherit"],
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (code !== 0 && signal !== "SIGTERM") {
      logger.error(
        { code, signal: signal ?? "none" },
        "SiteFlow child process exited unexpectedly",
      );
      process.exitCode = code ?? 1;
    }
  });
  return child;
}

function waitForHttp(url: string, attempts = 60): Promise<void> {
  return new Promise((resolve, reject) => {
    let remaining = attempts;
    const check = () => {
      const probe = httpRequest(url, { method: "GET", timeout: 1000 }, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      probe.on("error", retry);
      probe.on("timeout", () => {
        probe.destroy();
        retry();
      });
      probe.end();
    };
    const retry = () => {
      remaining -= 1;
      if (remaining <= 0) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(check, 500);
    };
    check();
  });
}

async function main() {
  startPython(
    ["-m", "uvicorn", "ml.main:app", "--host", "127.0.0.1", "--port", "8001"],
    {
      PORT: "8001",
      ML_ALLOWED_ORIGINS: "http://127.0.0.1:8000",
      BACKEND_ORIGIN: "http://127.0.0.1:8000",
    },
  );

  startPython(
    ["-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
    {
      PORT: "8000",
      DATABASE_URL:
        process.env["DATABASE_URL"] ||
        process.env["SITEFLOW_DATABASE_URL"] ||
        `sqlite:///${databasePath}`,
      ML_SERVICE_URL: "http://127.0.0.1:8001",
      FRONTEND_ORIGINS:
        process.env["FRONTEND_ORIGINS"] ||
        "http://localhost:5173,http://127.0.0.1:5173",
    },
  );

  await Promise.all([
    waitForHttp("http://127.0.0.1:8001/health"),
    waitForHttp("http://127.0.0.1:8000/health"),
  ]);

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "SiteFlow API gateway listening");
  });
  server.on("error", (error) => {
    logger.error({ error }, "SiteFlow API gateway failed to listen");
    process.exitCode = 1;
  });

  const shutdown = () => {
    server.close();
    for (const child of children) {
      child.kill("SIGTERM");
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error({ error }, "SiteFlow services failed to start");
  for (const child of children) {
    child.kill("SIGTERM");
  }
  process.exit(1);
});
