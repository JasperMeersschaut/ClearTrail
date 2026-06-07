# ClearTrail

Weather-optimized hiking route planner. Combines hyper-local forecasting with dynamic circular route generation, dry-feet trail scoring, and seasonal sun/shade preferences.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, PWA (vite-plugin-pwa), Leaflet / react-leaflet |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Weather | Tomorrow.io |
| Routing | OpenRouteService (foot-hiking) |

## Project Structure

```
ClearTrail/
├── apps/
│   ├── api/          # Express REST API
│   └── web/          # React PWA frontend
├── packages/
│   └── shared/       # Shared TypeScript types & helpers
└── db/
    ├── init/         # PostGIS extensions (Docker init)
    └── migrations/   # Schema migrations
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for PostgreSQL/PostGIS)

## Local Setup

### 1. Clone and install

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your API keys:

| Variable | Required for | Get it from |
|----------|--------------|-------------|
| `TOMORROW_IO_API_KEY` | Live weather forecasts | [Tomorrow.io](https://www.tomorrow.io/) |
| `OPENROUTESERVICE_API_KEY` | Real hiking routes | [OpenRouteService](https://openrouteservice.org/) |
| `JWT_SECRET` | Auth (change in production) | Any secure random string |

Maps use free OpenStreetMap tiles — no map API key required. When deployed to [Vercel](https://vercel.com/), `@vercel/analytics` and `@vercel/speed-insights` are initialized automatically for production monitoring.

The app runs with mock data when API keys are omitted.

### 3. Start PostgreSQL + PostGIS

```bash
docker compose up -d
```

This starts PostGIS on `localhost:5432` and runs extension init scripts automatically.

### 4. Run database migrations

```bash
pnpm migrate
```

### 5. Start development servers

```bash
pnpm dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001
- **Health check:** http://localhost:3001/health

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | PostGIS health check |
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Sign in (JWT cookie) |
| GET | `/api/v1/weather/optimal-window` | Best hiking window (24–48h) |
| POST | `/api/v1/routes/generate` | Generate circular route |
| GET | `/api/v1/gear/recommendation` | Clothing/gear advice |
| GET | `/api/v1/users/me/stats` | Dashboard statistics |
| POST | `/api/v1/hikes` | Log a completed hike |

## Feature Roadmap

1. **Foundation** — Monorepo, PostGIS, Express, React PWA shell
2. **Auth + Preferences** — JWT login, walking speed, duration defaults
3. **Weather Window** — Tomorrow.io integration, optimal start time scoring
4. **Circular Routing** — ORS round-trip routes from GPS + duration
5. **Dry Feet** — Penalize unpaved trails after recent rain
6. **Sun & Shadow** — Seasonal forest/exposed path weighting
7. **Gear Advisor** — Rule-based clothing recommendations
8. **Dashboard** — Hike logging and personal statistics

## Scripts

```bash
pnpm dev          # Start API + web in parallel
pnpm dev:api      # API only
pnpm dev:web      # Frontend only
pnpm migrate      # Apply database migrations
pnpm build        # Build all packages
pnpm typecheck    # Type-check all packages
```
