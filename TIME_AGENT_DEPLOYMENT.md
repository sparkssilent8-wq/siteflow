# SiteFlow — Time Agent + Railway Deployment

This version preserves the existing React/Vite + Express + FastAPI + ML + Clerk architecture and adds the browser-native Voice Time Agent.

## Time Agent flow

Browser microphone → SpeechRecognition → transcript → deterministic event extraction → existing `/api/matching` hybrid matcher → confirmation → existing Site Update / Review Queue → verified Activity actual start/finish/progress → variance/analytics.

No raw audio is stored by the Time Agent.

## Local production build

```bash
pnpm install --frozen-lockfile
python3 -m pip install -r artifacts/api-server/backend/requirements.txt -r artifacts/api-server/ml/requirements.txt
pnpm run build:production
PORT=3000 pnpm run start:production
```

Open `http://localhost:3000`.

## Railway architecture

Create one Railway application service from this repository and one Railway PostgreSQL service. The application service runs the Node gateway, FastAPI backend and ML service internally. Only the Node service is public.

### Build command

```bash
python3 -m pip install -r artifacts/api-server/backend/requirements.txt -r artifacts/api-server/ml/requirements.txt && pnpm install --frozen-lockfile && pnpm run build:production
```

### Start command

```bash
pnpm run start:production
```

### Required environment variables

- `DATABASE_URL` = Railway Postgres `DATABASE_URL` reference
- `VITE_API_BASE_URL=/api`
- `VITE_CLERK_PUBLISHABLE_KEY` = Clerk publishable key
- `CLERK_SECRET_KEY` = Clerk secret key
- `FRONTEND_ORIGINS` = public Railway HTTPS domain
- `PYTHON_BIN=python3`
- `ML_SERVICE_URL=http://127.0.0.1:8001`

Never commit real Clerk keys or database credentials.

### Railway setup

1. Push this repository to GitHub.
2. In Railway, create a new project from the GitHub repository.
3. Add a PostgreSQL database to the same project.
4. Keep the app service root at repository root.
5. Railway can use `railway.json`; verify the build/start commands above in service settings.
6. Add the required environment variables. For `DATABASE_URL`, use the Postgres service variable/reference rather than copying credentials into source code.
7. Deploy.
8. Generate a Railway public domain for the application service.
9. Put that HTTPS domain in `FRONTEND_ORIGINS`.
10. Ensure the same production domain is configured in Clerk if your existing Clerk setup requires an allowed origin/redirect.
11. Redeploy after environment variables are set.

## Important database behavior

`backend/database/init_db.py` creates missing tables and adds the Time Agent columns to an existing `site_updates` table. For an existing SQLite database, the migration is additive. For production, PostgreSQL is recommended.

## Acceptance test

Speak:

> Line 24 spool erection started at compressor station at 10:30 AM.

Expected: `ACTUAL_START`, Piping, matching L5/L6 activity, event time 10:30, then confirmation.

Speak:

> Line 24 spool erection completed at compressor station.

Expected: `ACTUAL_END`, confirmation, captured actual finish time and 100% completion when approved.

The phrase `completed up to 60%` is intentionally treated as `PROGRESS`, not full activity completion.
