# Railway Deployment Guide for SiteFlow

This guide walks you through deploying SiteFlow on Railway with full production support.

## Architecture Overview

SiteFlow runs as a unified Node.js gateway that:
- Serves the React + Vite frontend
- Proxies API requests to FastAPI backend (port 8000)
- Proxies ML service (port 8001)
- Manages Clerk authentication
- Connects to Railway PostgreSQL

All services run in a single Railway application service.

## Deployment Steps

### 1. Prerequisites

- GitHub repository already connected to Railway
- Railway project created
- PostgreSQL database service created in the same project

### 2. Environment Variables

Set these in your Railway service settings:

#### Database (from Railway PostgreSQL service)
```
DATABASE_URL=<Use Railway Postgres service variable reference>
```
Click the "Link" icon next to the PostgreSQL service to auto-populate this.

#### Frontend Configuration
```
PORT=3000
NODE_ENV=production
VITE_API_BASE_URL=/api
```

#### Clerk Authentication
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_<your-key>
CLERK_SECRET_KEY=sk_test_<your-key>
```
Get these from your Clerk dashboard.

#### CORS & Origins
```
FRONTEND_ORIGINS=https://<your-railway-domain>.up.railway.app
ML_SERVICE_URL=http://127.0.0.1:8001
```

Replace `<your-railway-domain>` with your actual Railway domain (visible in Railway dashboard).

#### Python & ML Service
```
PYTHON_BIN=python3
```

### 3. Build & Start Commands

Railway will automatically use commands from `railway.json`:

**Build:**
```bash
python3 -m pip install -r artifacts/api-server/backend/requirements.txt -r artifacts/api-server/ml/requirements.txt && pnpm run build:production
```

**Start:**
```bash
pnpm run start:production
```

### 4. Deploy

1. In Railway, go to your application service
2. Add all environment variables from section 2 above
3. Ensure the service root is set to the repository root (not a subdirectory)
4. Click "Deploy"
5. Wait for the build to complete (this takes ~5-10 minutes on first build)
6. Once deployed, Railway generates a public HTTPS domain (e.g., `https://siteflow-prod-xyz.up.railway.app`)

### 5. Update Frontend CORS After Deployment

Once Railway generates your public domain:

1. Copy the HTTPS URL
2. Update `FRONTEND_ORIGINS` in Railway service variables to match
3. Redeploy (or manually trigger a rebuild)
4. Update Clerk dashboard with the new domain if needed

### 6. Access Your Application

Open `https://<your-railway-domain>.up.railway.app` in your browser.

### 7. Verify Deployment

#### Check Frontend
- Open the public HTTPS URL
- Verify the React app loads

#### Check API Gateway
- `curl https://<your-railway-domain>.up.railway.app/api/health`
- Should return `{"status":"ok"}`

#### Check Backend
- `curl https://<your-railway-domain>.up.railway.app/api/`
- Should return the SiteFlow API root

#### Check ML Service
- Open Railway logs for the service
- Look for "SiteFlow ML Microservice" startup message
- Check health: backend probes `http://127.0.0.1:8001/health` automatically

### 8. Database Initialization

The backend automatically:
- Creates tables on first startup
- Adds columns for Time Agent functionality
- Seeds optional demo data

No manual migrations needed.

## Troubleshooting

### Build Fails with "ERR_PNPM_LOCKFILE_CONFIG_MISMATCH"

**This has been fixed.** The railway.json now uses:
- Nixpacks install phase: `pnpm install --no-frozen-lockfile`
- Build phase: Python deps + `pnpm run build:production`
- No redundant installs

### Application Won't Start

Check Railway logs for:
- `PORT=3000 not found` → PORT env var not set
- `DATABASE_URL not found` → Database not linked
- `CLERK_SECRET_KEY missing` → Clerk vars not set

### Frontend shows "Cannot reach API"

1. Verify `FRONTEND_ORIGINS` matches your Railway domain exactly
2. Check backend CORS in `artifacts/api-server/backend/main.py` line 37
3. Ensure `VITE_API_BASE_URL=/api` is set (not hardcoded domain)

### ML Service unavailable

1. Check that ml.main.py starts correctly (see Railway logs)
2. Verify `ML_SERVICE_URL=http://127.0.0.1:8001` (internal only, not public)
3. Backend will show "ml_status: degraded" if ML service fails to start

## Production Checklist

- [ ] DATABASE_URL linked to Railway PostgreSQL
- [ ] VITE_CLERK_PUBLISHABLE_KEY set
- [ ] CLERK_SECRET_KEY set
- [ ] FRONTEND_ORIGINS set to Railway public domain
- [ ] PORT=3000 set
- [ ] NODE_ENV=production set
- [ ] Application deployed and running
- [ ] Public HTTPS URL accessible
- [ ] Health checks passing
- [ ] Clerk authentication working

## Next Steps

1. **Set environment variables** in Railway service settings
2. **Deploy** the application
3. **Wait for build** to complete
4. **Copy the public URL** from Railway
5. **Update FRONTEND_ORIGINS** if needed
6. **Test the application** at the public URL

Your SiteFlow instance will be live at: `https://<your-railway-domain>.up.railway.app`
