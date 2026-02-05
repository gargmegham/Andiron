# FX Dashboard 🍍 **andiron-cursor ✅**

> _"Coins alone do not tell the story; show me the pattern and the change."_

A small FastAPI service + React dashboard that visualizes EUR→USD rates, shows day-by-day change, and includes a live rate card with manual refresh. The backend uses the Frankfurter public API with a local JSON fallback and Redis caching.

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
- `GET /health/cache`
- `GET /summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&breakdown=day|none`

### Example

```bash
curl "https://fx-api-bz9q.onrender.com/summary?start_date=2026-02-01&end_date=2026-02-05&breakdown=day"
```

Example response:

```json
{
  "breakdown": "day",
  "days": [
    {
      "date": "2026-01-30",
      "rate": 1.1919,
      "pct_change": null
    },
    {
      "date": "2026-02-02",
      "rate": 1.184,
      "pct_change": -0.6628072824901433
    },
    {
      "date": "2026-02-03",
      "rate": 1.1801,
      "pct_change": -0.3293918918918931
    },
    {
      "date": "2026-02-04",
      "rate": 1.182,
      "pct_change": 0.16100330480467867
    }
  ],
  "totals": {
    "start_rate": 1.1919,
    "end_rate": 1.182,
    "total_pct_change": -0.8306065945129643,
    "mean_rate": 1.1844999999999999
  },
  "source": "network",
  "cache_status": "miss"
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
- Render: set `REDIS_URL` to the **full connectionString** from the keyvalue service (includes password and host), not just host:port.

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
