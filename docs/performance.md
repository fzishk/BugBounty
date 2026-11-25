# Performance

**How measured:** `npm run perf` runs `src/perf/catalog.perf.tsx`. It renders the real components and a naive
"before" version side by side, with React's `<Profiler>` and DOM node counts. Timings come from jsdom, so read them
**relative to each other**. Bundle sizes come from `vite build`. Lighthouse ran on the production build in headless Chrome.

## D4-2: the two slowest spots on the product list, and their fixes

### Fix 1: rendering every loaded card → virtualized grid

After scrolling through 10 pages (480 products), a plain grid keeps every card in the DOM. Each later re-render
(live stock tick, add to cart) touches all of them.

| 480 products loaded | React commit time | DOM nodes |
| ------------------- | ----------------- | --------- |
| Before: plain grid  | 279 ms            | 10,561    |
| After: virtualized  | 37 ms             | 967       |

**Fix:** `VirtualProductGrid` uses `@tanstack/react-virtual`'s window virtualizer. Only rows near the viewport are
rendered (about 4–6 rows, plus 2 rows of overscan). Rows are measured after render, so cards can have different heights. The
column count follows the container width (`useElementWidth`). The next page loads when the skeleton row scrolls into view (infinite query).

### Fix 2: one API request per keystroke → debounced search

| Typing "mechanical keyboard" (19 keys, ~60 ms apart) | Requests |
| ---------------------------------------------------- | -------- |
| Before: request on every change                      | 19       |
| After: `useDebouncedValue(…, 300)`                   | 1        |

Every extra request filters and sorts 5,000 products on the server, and makes out-of-order responses more likely.
The input still updates instantly, because only the URL and the request wait for the pause.

## D4-3: memoization and virtualization, justified

| Optimization                                                             | Kept?       | Why (measured)                                                                                                                                                                       |
| ------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Virtualized grid                                                         | **Kept**    | 10,561 → 967 DOM nodes; 279 → 37 ms (Fix 1).                                                                                                                                         |
| `React.memo(ProductCard)` + a selector for **this product's** live stock | **Kept**    | One live stock tick re-rendered **48 → 1** cards. Without it, every tick (every 2.5 s) re-renders every visible card.                                                                |
| `createSelector` for cart count and total                                | **Kept**    | The header reads the count on every store change. Memoized, it recomputes only when `cart.lines` changes.                                                                            |
| Products array `useMemo` keyed on `currentData.pages`                    | **Kept**    | Keeps `products` stable between renders, so the grid's visible-id effect doesn't fire on every render.                                                                               |
| Lazy-loading the Dev tools panel                                         | **Kept**    | It imports the mock server. Main bundle **533 kB → 304 kB** (gzip 182 → 102 kB).                                                                                                     |
| Route-level `React.lazy`                                                 | **Kept**    | Each page is its own chunk (1–45 kB); the home page doesn't download the virtualizer.                                                                                                |
| `useCallback` on every handler (e.g. card `onClick`)                     | **Skipped** | The handlers are passed to native elements or to non-memoized children, so a new function each render costs nothing. Adding it everywhere makes the code harder to read for no gain. |
| `React.memo` on `Price`, `Rating`, `StockBadge`                          | **Skipped** | They render a few spans each, and their parent (the memoized card) already bails out. Memo would only add prop comparisons.                                                          |
| Virtualizing the home page "Top rated" list                              | **Skipped** | It shows 8 items; there is nothing to save.                                                                                                                                          |

## Lighthouse (production build, headless Chrome, desktop)

| Page  | Performance | Accessibility | Best practices |
| ----- | ----------- | ------------- | -------------- |
| Home  | 91          | 100           | 100            |
| Cart  | 90          | 100           | 100            |
| Login | 92          | 100           | 100            |

Performance stays in the low 90s mainly because the mock server (MSW Service Worker) has to start before the first render.
A real backend would remove that.
