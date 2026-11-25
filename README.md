# The Bug Bazaar

A small React + TypeScript store that sells developer gear: rubber ducks, mechanical keyboards, coffee and stickers.
It runs entirely in the browser against a mock API, so there is no backend to set up.

**Live demo:** https://fzishk.github.io/BugBounty/
**Demo login:** `demo@bugbazaar.dev` / `duck1234`

![CI](https://github.com/fzishk/BugBounty/actions/workflows/ci.yml/badge.svg)

## Quick start (under 5 minutes)

Requirements: **Node.js 20 or newer** (`.nvmrc` pins 22) and npm.

```bash
git clone https://github.com/fzishk/BugBounty.git
cd BugBounty
npm ci            # install exact versions from package-lock.json
npm run dev       # open http://localhost:5173
```

No `.env` file is needed. The mock API starts automatically.

## Scripts

| Script                 | What it does                                                       |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | Start the dev server with hot reload                               |
| `npm run build`        | Type check, then build for production into `dist/`                 |
| `npm run preview`      | Serve the production build locally                                 |
| `npm test`             | Run the test suite once (Vitest + Testing Library + MSW)           |
| `npm run test:watch`   | Run tests in watch mode                                            |
| `npm run lint`         | ESLint (TypeScript, React hooks, accessibility rules)              |
| `npm run typecheck`    | `tsc --noEmit` in strict mode                                      |
| `npm run format`       | Format everything with Prettier (`format:check` only verifies)     |
| `npm run check`        | Lint + type check + tests + build: the same checks CI runs         |
| `npm run perf`         | Re-run the before/after measurements used in `docs/performance.md` |
| `npm run generate:art` | Regenerate the product illustrations in `public/images/products`   |

## Environment variables

All are optional. Copy `.env.example` to `.env.local` to override.

| Variable              | Default                           | Purpose                                                       |
| --------------------- | --------------------------------- | ------------------------------------------------------------- |
| `VITE_API_BASE_URL`   | `/api/`                           | Base URL for REST calls                                       |
| `VITE_LIVE_STOCK_URL` | `wss://live.bugbazaar.mock/stock` | WebSocket URL for live stock                                  |
| `VITE_ENABLE_MOCKS`   | `true`                            | Run the in-browser mock API. Set `false` to use a real server |
| `VITE_BASE`           | `/`                               | Build-time public path (CI sets `/BugBounty/` for Pages)      |

## Trying every state on purpose

Click **Dev tools** (bottom left) to drive the mock server:

- **Latency:** instant, normal, slow, or **out of order** (for race conditions)
- **Force errors:** product list 500, product detail 500, place order 400 / 409 / 500
- **Actions:** expire the session (401), drop the live stock WebSocket, throw a render error, open a missing product (404)

Settings are saved in `localStorage`, so they survive a refresh. Use **Reset all to normal** to undo them.
The mock database is in memory, so a full page reload resets stock and orders.

## Folder structure

```
src/
  api/          contract types, RTK Query API, base query, WebSocket client  (all network code)
  app/          store, typed hooks, routes
  features/     one folder per feature: catalog, product, cart, checkout, auth, live, devtools, toast
  components/   shared UI: layout, ui primitives, feedback (state views, error boundary, toasts)
  hooks/        reusable custom hooks
  lib/          framework-free helpers: money, errors, request state, storage, logger, config
  mocks/        MSW mock server: seeded DB, REST handlers, WebSocket handler, fault injection
  pages/        pages that don't belong to a feature (home, 404, crash demo)
  perf/         before/after measurement suite
  test/         test setup and render helpers
docs/           written tasks (architecture, decisions, contract, auth, performance, ...)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the data flow.

## Tech stack

React 18, TypeScript (strict), Redux Toolkit + RTK Query, React Router 6, Tailwind CSS 4, MSW 2 (REST and WebSocket mocks),
TanStack Virtual, Vitest + Testing Library, ESLint + Prettier, GitHub Actions + GitHub Pages.
Why each was chosen is in [docs/decisions.md](docs/decisions.md).

## Docs

| Document                                | Task       |
| --------------------------------------- | ---------- |
| [api-contract.md](docs/api-contract.md) | D1-2       |
| [decisions.md](docs/decisions.md)       | All tasks  |
| [auth.md](docs/auth.md)                 | D3-3       |
| [performance.md](docs/performance.md)   | D4-2, D4-3 |
| [monitoring.md](docs/monitoring.md)     | D4-7       |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | D5-1, D5-2 |
| [orders.md](docs/orders.md)             | D5-3       |
| [glossary.md](docs/glossary.md)         | D5-4       |
| [ai-notes.md](docs/ai-notes.md)         | D5-7       |
| [reflection.md](docs/reflection.md)     | D5-8       |

## Deployment

- **CI** (`.github/workflows/ci.yml`) runs lint, formatting, type check, tests and build on every pull request.
  `main` is protected and requires this check, so a failing test blocks the merge.
- **Deploy** (`.github/workflows/deploy.yml`) builds `main` with `VITE_BASE=/BugBounty/` and publishes to GitHub Pages.
  `index.html` is copied to `404.html` so deep links such as `/BugBounty/products/prod-0042` work.
