# SiteFlow Microservice Integration Patch

This patch separates the ML service from the FastAPI backend while keeping the existing UI and database structure.

## Architecture

Browser -> Frontend/Vite -> Backend FastAPI :8000 -> HTTP -> ML FastAPI :8001
                                              -> SQLite siteflow.db

The frontend never calls port 8001. The backend reads `ML_SERVICE_URL` from the environment and persists prediction/recommendation results.

## New/changed files

- `backend/services/ml_client.py` - async HTTP client for the ML microservice.
- `backend/api/ml_proxy.py` - backend-facing ML routes, persistence, prediction history, and graceful 503 handling.
- `backend/api/review.py` - verified site updates trigger a best-effort ML prediction without failing the approval when ML is offline.
- `backend/database/database.py` - environment-configurable SQLite URL.
- `ml/api/schemas.py` - ML-owned Pydantic contracts; ML no longer imports backend schemas.
- `ml/api/ml_router.py` - standalone `/predict`, `/simulate`, `/anomaly`, `/recommend`, `/health` routes.
- `ml/main.py` - standalone FastAPI app and configurable CORS.
- `frontend/src/api/client.js` - single backend API base URL.
- `frontend/vite.config.js` - local `/api` and `/health` proxy only to backend.
- `frontend/nginx.conf` - production Docker proxy for `/api`, `/health`, and `/uploads` to backend.
- `.env.example` files for backend, frontend, and ML.
- `docker-compose.yml` - backend talks to `ml_service:8001`; backend no longer mounts ML source.

## Local development

Terminal 1:

```bash
PYTHONPATH=. uvicorn ml.main:app --host 0.0.0.0 --port 8001
```

Terminal 2:

```bash
PYTHONPATH=. ML_SERVICE_URL=http://127.0.0.1:8001 uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 3:

```bash
cd frontend
npm install
npm run dev
```

The browser calls `/api/...`; Vite proxies those calls to the backend. The backend then calls the ML service.

## Docker

```bash
docker compose up --build
```

In Docker, the backend uses `http://ml_service:8001`, not `127.0.0.1:8001`.

## Verification performed

- Python compilation passed for backend and ML Python files.
- Existing ML unit tests passed: 3/3.
- Existing backend API tests passed: 7/7.
- Live local integration test passed for ML health, backend -> ML health, and `/api/ml/predict` through the backend.
- The uploaded SQLite database was restored to its original uploaded state after testing.

Note: a local frontend build could not be completed in the build container because its pre-existing Rollup optional native dependency was missing; `npm ci` was attempted but timed out. The patch itself does not depend on that local `node_modules` state.
