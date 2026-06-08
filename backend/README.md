# Backend

FastAPI backend for the 3D print cost app.

## What it does

- exposes a health endpoint
- provides generic CRUD for the main tables
- offers a bootstrap endpoint to create the first household

## Important env vars

- `DATABASE_URL`
- `APP_NAME`
- `CORS_ORIGINS`

## Run locally

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

