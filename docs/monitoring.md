# Monitoring

## What happens when something breaks

- **Render errors:** `ErrorBoundary` (`src/components/feedback/ErrorBoundary.tsx`) wraps the routes and shows a
  "We hit an unexpected bug" screen with **Try again** and **Go to home page**. The header, cart and navigation keep working, and
  navigating away clears the error (`resetKey = pathname`). A second boundary around the whole app catches anything else.
- **Errors outside rendering** (event handlers, promises): `installGlobalErrorHandlers()` listens to `error` and `unhandledrejection`.
- **Logging:** everything goes through `logError()` (`src/lib/logger.ts`), which writes one structured line
  (`[bazaar:error] { source, message, ... }`) and keeps the last 20 errors. The Dev tools panel lists them.
  In production `logError` is the one place to forward to Sentry, Datadog or a `/api/logs` endpoint.
- **Try it:** Dev tools → **Throw a render error** (route `/debug/crash`).

## Three things I would track

1. **Checkout funnel and failures.** Order success rate, and checkout errors split by status (409 out-of-stock, 500, network).
   This is where problems cost real money. Alert if order success drops below the usual baseline, or 5xx goes above 1%.
2. **Front-end error rate per release.** Unhandled errors and error-boundary fallbacks per 1,000 sessions, grouped by
   message and route, tagged with the commit SHA. A spike right after a deploy means roll back.
3. **Core Web Vitals and API latency.** LCP, INP and CLS from real users (`web-vitals`), and p95 latency for
   `GET /api/products` while searching. Slow search makes people leave before they buy anything.

Also worth watching: 401 rate (sessions expiring too early), and how often the live stock WebSocket reconnects (network or server problems).
