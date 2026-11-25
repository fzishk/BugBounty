# Decisions

One entry per task: what I used, what else I considered, and why. Format: **Used / Considered / Why**.

## Day 1: Foundation

### D1-1 Setup

- **Used:** Vite 6, ESLint 9 flat config (typescript-eslint strict, react-hooks, jsx-a11y), Prettier with the Tailwind plugin, `.nvmrc`, `.editorconfig`, a `npm run check` script that matches CI.
- **Considered:** Create React App (deprecated), Next.js (server rendering isn't needed for a client-only store with a mock API), Biome instead of ESLint + Prettier (faster, but no jsx-a11y equivalent yet).
- **Why:** Vite starts in under a second and needs almost no config. The lint rules catch accessibility and hook bugs, not just style.

### D1-2 HTTP and API contracts

- **Used:** MSW 2 (Mock Service Worker) with handlers in `src/mocks/`. 5,000 products from a seeded PRNG. A fault-injection module (`chaos.ts`) driven by the Dev Tools panel.
- **Considered:** json-server (needs a second process and can't run on GitHub Pages), hard-coded promises in the client (the old `mockApi.ts`: no HTTP, no status codes, and the client knows it is talking to a mock).
- **Why:** MSW intercepts real `fetch` calls, so the app code is the same code that would talk to a real backend. Status codes, headers (`Authorization`, `Idempotency-Key`) and the error envelope are real. The same handlers run in tests (`msw/node`), so tests and the app share one fake backend.

### D1-3 TypeScript

- **Used:** `strict`, `noUncheckedIndexedAccess`. Contract types are shared by client and mock (`src/api/contract.ts`). Request status is the union `RequestState<T>` (`loading | error | success`) and the session is the union `signed-in | signed-out`. ESLint bans `any`, `@ts-ignore` and `!` (non-null assertions) in app code.
- **Considered:** Separate boolean flags (`isLoading`, `isError`, `data`). They allow impossible combinations such as loading with an error, or success with no data.
- **Why:** With a discriminated union the compiler forces every page to handle each state, and `data` only exists when `status === 'success'`.

### D1-4 Data layer

- **Used:** RTK Query (`src/api/bazaarApi.ts`) with one custom base query (`src/api/baseQuery.ts`). The WebSocket client lives in `src/api/liveStockSocket.ts`. Components only use the generated hooks.
- **Considered:** A hand-written `apiClient` with `fetch` and `useEffect` in every page (the previous version), and TanStack Query.
- **Why:** One place adds the auth header, handles 401 centrally, normalizes errors, and owns caching. TanStack Query would work just as well; RTK Query was chosen because Redux Toolkit is already required for D3-1, so one library covers both.

## Day 2: Browse

### D2-1 Product list

- **Used:** A card grid. Each card has one "stretched" link (the whole card is clickable, but screen readers hear one link) and a separate Add button. Prices are integer cents formatted by `Intl.NumberFormat`. Images are flat SVG illustrations generated for this project (`scripts/generate-product-art.mjs`).
- **Considered:** Free photo APIs. DummyJSON has no keyboards, rubber ducks or stickers, and hot-linking random photos is fragile.
- **Why:** Local SVGs are tiny, free, always load, and match the flat style.

### D2-2 Filters

- **Used:** The URL is the only source of truth (`useCatalogFilters`). Values are parsed and validated from `?q=&category=&sort=&inStock=1`, and written back with a fixed key order.
- **Considered:** Redux or `useState` for filters, synced to the URL.
- **Why:** With one source of truth there is nothing to sync. Refresh, shared links and Back all work for free. Typing a search replaces the history entry, so Back doesn't step through every letter.

### D2-3 UI states

- **Used:** Shared `LoadingState` / skeletons, `EmptyState` and `ErrorState` (with Try again) in `components/feedback/StateViews.tsx`, chosen from a `RequestState`.
- **Why:** The same layout on every page. Each state can be triggered from Dev tools.

### D2-4 useEffect and cleanup

- **Used:** `useProduct` subscribes to the product cache in an effect. Its cleanup unsubscribes and **aborts the in-flight request** when the id changes or the page closes. Back to Top (`useScrollThreshold`) removes its scroll listener and cancels its animation frame. The live stock socket closes on unmount and on `pagehide`.
- **Detail:** The abort runs in a microtask and only when the request is truly unwanted, because React StrictMode unmounts and remounts once in development. A plain abort there would cancel a request the page still needs.

### D2-5 Custom hooks

`useDebouncedValue` (catalog search, live-stock subscriptions), `useScrollThreshold` (Back to Top), `useDocumentTitle` (every page),
`useElementWidth` (grid columns), `useCatalogFilters`, `useProduct` and `useLiveStock`. All typed, all with cleanup.

### D2-6 Race conditions

- **Used:** RTK Query caches each query under its arguments, and the UI reads `currentData` (data for the **current** arguments only). The Dev tools "out of order" latency gives each response a random 0.1–2.5 s delay. A test makes "duck" slower than "keyboard" and checks only keyboard results appear.
- **Considered:** `AbortController` per keystroke, or comparing a request id before calling `setState`.
- **Why:** Keyed caching fixes the problem by design. A late response for an old query lands in its own cache entry and is never displayed. Debouncing also cuts how often it can happen.

## Day 3: Buy

### D3-1 Redux Toolkit

- **Used:** Slices: `session`, `cart`, `liveStock`, `toasts`, plus the RTK Query `api` slice. The cart count and total are `createSelector` selectors. The header badge reads `selectCartCount`, never a stored count.
- **Why:** State changes only through named actions (`itemAdded`, `quantityChanged`, `sessionExpired` ...), which is easy to test and to trace in Redux DevTools.

### D3-2 Cart

- Quantities are clamped to stock in the reducer, so no component can bypass the rule. Live stock updates lower quantities that no longer fit.
- The cart is persisted to `localStorage` and validated on load.
- 409: the server returns `{ productId, available }`, the checkout names that product, and the cart is corrected to what's left.
- **Duplicate orders:** each checkout attempt gets an `Idempotency-Key` (a UUID in `sessionStorage`, tied to the cart contents). Retries after a 500, timeout, double click or reload reuse the key, and the server returns the first order. A ref also blocks a second submit before React re-renders.

### D3-3 Auth

`RequireAuth` guards `/checkout`, `/account` and `/orders/:id`, and passes `state.from` so login returns you there. A 401 on any
authenticated call clears the session in the base query. The login form is double-submit safe. See [auth.md](auth.md).

### D3-4 Backend errors

One adapter, `toAppError()` in `src/lib/errors.ts`, turns every transport error into an `AppError` union. UI copy comes from
`ERROR_COPY` and `fieldMessage`, never from `error.message`. 400 → field errors, 401 → signed out with a notice,
404 → Not Found page, 409 → names the item, 500 / network → Try again.

### D3-5 Caching

RTK Query keeps unused data for 5 minutes (`keepUnusedDataFor: 300`), so going back to a page or product shows it instantly with no request. Placing an
order invalidates the `Product` tags it touched, so stock is refetched. Live stock overrides cached stock in between.
**When stale data is fine:** names, prices, images and ratings change rarely, so cached values for a few minutes are fine. Stock on a
browse page may be a little stale, because the server re-checks stock at checkout (409). Account and order data use
`keepUnusedDataFor: 0`, because they must be correct and private.

## Day 4: Harden

### D4-1 Accessibility

Skip link, landmarks, one `h1` per page, labelled controls, native radios and checkboxes for filters, `aria-invalid` +
`aria-describedby` for field errors, `role="alert"` banners and an `aria-live` toaster, visible focus rings, `prefers-reduced-motion`.
Lighthouse accessibility: **100** on home, cart and login (Chrome headless, production build).

### D4-2 / D4-3 Performance, memoization, virtualization

See [performance.md](performance.md).

### D4-4 WebSockets

- **Used:** A real `WebSocket`, mocked by MSW's `ws` API. The client (`connectLiveStock`) reconnects with exponential backoff and jitter, and re-subscribes after reconnecting.
  Each page opens one socket for the products it shows and closes it on unmount or `pagehide`.
- **Considered:** Polling every N seconds (the previous version): simple, but wastes requests and is always behind. Server-Sent Events: server → client only, with automatic reconnect, and enough here since the client only sends a subscription list. With SSE the subscription would have to go in the URL.
- **When I'd pick WebSockets:** for two-way or high-frequency updates (bids, chat, collaborative editing). **SSE** for one-way feeds behind plain HTTP. **Polling** when updates are rare and simplicity matters more than speed.

### D4-5 Testing

Vitest + Testing Library + MSW. 26 tests render the real app against the mock API and assert what a user sees: cart rules,
hooks, login, filters, race condition, product switching, checkout success, 409, idempotency, 401, error boundary, WebSocket reconnect.

### D4-6 CI/CD

GitHub Actions: lint, format, type check, test and build on every PR. Branch protection on `main` requires the job. Bonus: `deploy.yml` publishes `main` to GitHub Pages.

- **Considered:** Vercel (an earlier attempt failed on version conflicts). Pages keeps everything in GitHub and needs no account linking. `404.html` handles deep links, since Pages has no SPA rewrites.

### D4-7 Monitoring

An error boundary around routes (reset on navigation) and one around the whole app. `logError` plus global `error` and `unhandledrejection` handlers. See [monitoring.md](monitoring.md).
