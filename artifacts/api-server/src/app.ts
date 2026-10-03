import express, { type Express, type RequestHandler } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { createProxyMiddleware } from "http-proxy-middleware";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Clerk's frontend API proxy must run before body parsers. It streams
// requests to Clerk and is only active for production deployments.
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));

// Resolve the publishable key from the public host so the same gateway works
// for the Replit deployment and any configured custom domain.
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY ||
        process.env.VITE_CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// Keep deployment and workflow health checks public. All application data
// routes below require a Clerk session.
app.get(["/api/healthz", "/api/health"], (_req, res) => {
  res.json({ status: "ok" });
});

const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ detail: "Authentication required." });
    return;
  }

  next();
};

const pythonApiProxy = createProxyMiddleware({
  target: "http://127.0.0.1:8000",
  changeOrigin: true,
  // Express removes the mount prefix from req.url. Preserve /api for
  // FastAPI, while also handling proxy versions that pass originalUrl.
  pathRewrite: (path) => (path.startsWith("/api") ? path : `/api${path}`),
});

app.use("/api", requireAuth, pythonApiProxy);

// Production frontend: Express serves the Vite build from the monorepo.
// Keep this after /api so API requests are never swallowed by the SPA fallback.
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const frontendDist = path.resolve(currentDir, "../../siteflow/dist/public");
app.use(express.static(frontendDist));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;
