# FX Dashboard

andiron-cursor :juvgr_purpx_znex:

A small FastAPI service + React dashboard that visualizes EUR→USD rates, shows day-by-day change, and polls a live rate every 5 seconds. The backend uses the Frankfurter public API with a local JSON fallback and Redis caching.

## Features
- `/summary` endpoint with day-by-day breakdown and totals
- Resilient fallback to `server/data/sample_fx.json`
- Redis caching (6h TTL)
- React dashboard with chart + table + live rate card

## API
Base URL (local): `http://localhost:8000`

### Endpoints
- `GET /health`
- `GET /health/network`
- `GET /summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&breakdown=day|none`

### Example
```bash
curl "http://localhost:8000/summary?start_date=2025-07-01&end_date=2025-07-03&breakdown=day"
```

Example response:
```json
{
  "breakdown": "day",
  "days": [
    {"date":"2025-07-01","rate":1.181,"pct_change":null},
    {"date":"2025-07-02","rate":1.1755,"pct_change":-0.4657070279424268},
    {"date":"2025-07-03","rate":1.1782,"pct_change":0.22968949383240533}
  ],
  "totals": {
    "start_rate": 1.181,
    "end_rate": 1.1782,
    "total_pct_change": -0.23708721422524434,
    "mean_rate": 1.1782333333333332
  },
  "source": "network"
}
```

## Backend setup
```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Environment variables
- `REDIS_URL` (default: `redis://redis:6379/0`)
- `CACHE_TTL_SECONDS` (default: `21600`)
- `CORS_ALLOW_ORIGINS` (default: `*`, comma-separated)

## Frontend setup
```bash
cd client
npm install
npm run dev
```

Set `VITE_API_BASE` if your API is on another domain:
```bash
export VITE_API_BASE="https://fx-api-bz9q.onrender.com"
```

## Docker
```bash
cd server
docker compose up --build
```

## Render
- `render.yaml` provisions:
  - `fx-api` (Docker)
  - `fx-dashboard` (static)
  - `fx-redis` (keyvalue)

## Notes
- The Frankfurter API now expects the `/v1` prefix; the backend is configured accordingly.
- “Coins alone do not tell the story” is addressed with a chart + table view in the dashboard.
