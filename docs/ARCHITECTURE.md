# Architecture

## Folder structure

```
src/
├── main.tsx                 boot: start mock server → create store → render <App/>
├── app/                     store.ts (slices + persistence), hooks.ts (typed hooks), App.tsx (routes)
├── api/                     ALL network code
│   ├── contract.ts          shared types (client + mock)
│   ├── baseQuery.ts         auth header, central 401 handling
│   ├── bazaarApi.ts         RTK Query endpoints, cache tags
│   └── liveStockSocket.ts   WebSocket client with reconnect
├── features/                feature = UI + state + hooks that change together
│   ├── catalog/             CatalogPage, VirtualProductGrid, ProductCard, FiltersPanel, useCatalogFilters
│   ├── product/             ProductDetailPage, useProduct, Reviews
│   ├── cart/                cartSlice, CartPage, OrderSummary
│   ├── checkout/            CheckoutPage, OrderConfirmationPage, idempotency key
│   ├── auth/                sessionSlice, LoginPage, AccountPage, RequireAuth, SessionWatcher
│   ├── live/                liveStockSlice, useLiveStock
│   ├── toast/               toastSlice
│   └── devtools/            DevToolsPanel (drives the mock)
├── components/              shared, feature-agnostic UI
│   ├── layout/  ui/  feedback/
├── hooks/                   generic hooks (debounce, scroll, title, element width)
├── lib/                     framework-free: money, errors, requestState, storage, logger, config
├── mocks/                   MSW: db, handlers, liveStock, chaos, browser/node setup
└── pages/                   Home, NotFound, Crash
```

**Rule of thumb:** `features/*` may import from `components`, `hooks`, `lib`, `api` and `app/hooks`. Shared folders never import from
features (except `Header`, which reads the cart and session). Only `src/api` and `src/mocks` know about HTTP.

## Data flow

```mermaid
flowchart LR
  subgraph Browser
    UI[React components] -- dispatch actions --> Store[(Redux store)]
    Store -- selectors --> UI
    UI -- "useXQuery / useXMutation" --> RTKQ[RTK Query<br/>bazaarApi]
    RTKQ <--> Store
    RTKQ --> BQ[baseQuery<br/>auth header, 401 → sessionExpired]
    BQ -- fetch --> SW{{MSW Service Worker}}
    UI -- useLiveStock --> WS[liveStockSocket<br/>reconnect + backoff]
    WS -- stockUpdated --> Store
    URL[(URL ?q=&category=)] <-- useCatalogFilters --> UI
    Store -- cart, session --> LS[(localStorage)]
  end
  SW --> H[REST handlers] --> DB[(in-memory DB<br/>5,000 products)]
  WS <-. ws.link .-> L[WS handler] --> DB
  Chaos[Dev tools / chaos] -.-> H
```

**One request, end to end (search):** typing updates local `draft` → `useDebouncedValue` waits 300 ms → `setFilters` writes
`?q=` to the URL → `useCatalogFilters` parses the URL → `useGetProductsInfiniteQuery(filters)` → cache hit? render now : `baseQuery` →
`fetch('/api/products?search=…')` → MSW handler → JSON → stored in the cache under those exact filters → `currentData` → `RequestState` →
grid. A late response for an older query goes into _its own_ cache entry and is never shown.

## Where each kind of state lives

| State                                                                | Lives in                         | Why there                                                                              |
| -------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| **Server**: products, user, orders                                   | RTK Query cache (`state.api`)    | It's a copy of the server's data: cached, invalidated, refetched, never edited by hand |
| **Server, pushed**: live stock                                       | `liveStock` slice                | Overrides cached stock until the next fresh fetch for that product                     |
| **Client**: cart                                                     | `cart` slice + `localStorage`    | Owned by the user, shared by header/cart/checkout, survives reload                     |
| **Client**: session                                                  | `session` slice + `localStorage` | Needed by the base query, guards and header                                            |
| **Client**: toasts                                                   | `toasts` slice                   | Raised from anywhere (cards, session watcher, dev tools)                               |
| **URL**: catalog filters, product id, order id                       | React Router                     | Shareable, refresh-safe, Back button works                                             |
| **Local UI**: search draft, form fields, quantity picker, panel open | `useState`                       | Only one component cares; no reason to share                                           |
| **Mock server**: DB, chaos settings                                  | `src/mocks` module state         | Plays the role of the backend; not app state                                           |

## A choice I'd defend: the URL as the only source of truth for filters

The alternative was filters in Redux, synced to the URL. With two copies, there are bugs about which one wins
(Back button, reload, a pasted link) and an effect to keep them in sync. With the URL as the only copy,
`parseFilters(searchParams)` _is_ the state: refresh, shared links and Back/Forward work without extra code,
and invalid values (`?category=hats`) fall back to defaults because parsing validates. The cost: the URL needs a
stable format, so `serializeFilters` writes keys in a fixed order and leaves out defaults. That also means the same view always
produces the same RTK Query cache key, which keeps cache hits high.

## Design patterns used

| Pattern                                    | Where                                                                                                                                                                                             | Why                                                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adapter**                                | `toAppError()` (`lib/errors.ts`) turns `FetchBaseQueryError` / `SerializedError` into `AppError`. `toRequestState()` (`lib/requestState.ts`) turns RTK Query's flags into a `RequestState` union. | The UI depends on our own small types, not on the transport library. Swapping RTK Query or the error format means changing one file. It is also why raw server messages can't reach the screen. |
| **Container / presentational**             | `CatalogPage` (reads the URL, runs queries, picks a state) → `VirtualProductGrid`, `FiltersPanel`, `StateViews` (props in, UI out). `CheckoutPage` → `OrderSummary`, `TextField`, `Alert`.        | Presentational parts are reused across pages and are easy to reason about and test. Data and side effects stay in one place per page.                                                           |
| **Custom hooks**                           | `useCatalogFilters`, `useProduct`, `useLiveStock`, `useDebouncedValue`, `useScrollThreshold`, `useDocumentTitle`, `useElementWidth`                                                               | Each one bundles state, effects and cleanup behind a small API, so pages read like a description of behaviour.                                                                                  |
| _Also:_ **Observer**                       | `liveStockSocket` callbacks, `chaos.subscribe` + `useSyncExternalStore`, the store subscription that writes to `localStorage`                                                                     | Push-based updates without polling.                                                                                                                                                             |
| _Also:_ **Guard / higher-order component** | `RequireAuth`, `ErrorBoundary`                                                                                                                                                                    | Cross-cutting rules applied by wrapping a route.                                                                                                                                                |
