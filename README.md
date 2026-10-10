# DAC Starter

A full-stack starter for applications with a Vue 3 frontend, a Hono API under `/api/*`, and a SQLite data store.

## Stack

- Vue 3, Vite, Vue Router, and UnoCSS in `frontend`
- Hono and `better-sqlite3` in `backend`
- Caddy as the development and preview reverse proxy
- pnpm workspace management

## Prerequisites

- Node.js compatible with the locked dependencies
- pnpm 12.10.1

## Getting started

Install dependencies, configure the backend environment, then start the complete development stack:

```sh
pnpm install
cp .env.example backend/.env
pnpm dev
```

Open `http://dac.localhost`. Caddy routes `/api/*` to the Hono server on port 8080 and all other requests to the Vite development server.

The backend reads `BEARER_TOKEN` and `DB_PATH` from its environment or from `backend/.env`. Environment variables take precedence. The default data directory is gitignored.

## Commands

```sh
pnpm dev                 # Run Caddy, the Hono watcher, and Vite
pnpm dev:backend         # Run only the backend on port 8080
pnpm dev:frontend        # Run only the Vite frontend
pnpm build               # Build both packages and bundle the frontend into the backend output
pnpm preview             # Build and run the production-style Caddy/backend stack
pnpm lint                # Lint the workspace
```

There is no automated test suite yet. To lint a changed file directly, use:

```sh
pnpm lint -- frontend/src/pages/index.vue
pnpm lint -- backend/src/core/handlers.ts
```

## Docker

From the repository root, build the production image. It compiles the frontend and serves it through the Hono backend:

```sh
docker build --tag dac-starter --file Dockerfile .
```

Run the image and publish its internal port 8080 to port 8080 on the host:

```sh
docker run --rm --publish 8080:8080 --env BEARER_TOKEN=change-me --volume dac-starter-data:/app/data dac-starter
```

`--publish 8080:8080` is required to access the container from the host. With Docker Desktop WSL integration, open `http://localhost:8080` from Windows. The SQLite database persists in the `dac-starter-data` volume.

## API and persistence

The starter exposes a SQLite-backed key-value cache:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/kv/:key` | Read a cache value |
| `GET` | `/api/kv` | List unexpired cache rows |
| `PUT` | `/api/kv` | Store a value (`key`, `value`, optional `ttl`) |
| `DELETE` | `/api/kv/:key` | Remove one value |
| `DELETE` | `/api/kv` | Clear the cache |
| `GET` | `/api/health` | Health check |

Rows are stored in SQLite with WAL enabled. Values expire after five minutes by default; pass an optional `ttl` in milliseconds to change that duration.

## Browser verification

`.github/mcp.json` configures the Playwright MCP server for Copilot sessions. It starts through `npx` when enabled by Copilot and can be used to inspect and verify the running application in a browser.
