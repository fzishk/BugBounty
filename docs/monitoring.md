# Monitoring & Error Recovery

## Runtime Fallback
- `ErrorBoundary` in `src/components/ErrorBoundary.tsx` catches unexpected rendering/lifecycle errors, displays a recovery fallback UI instead of a blank screen, and logs error details (`console.error` / client error sink).

## Three Things Tracked in Production
1. **Unhandled UI & Runtime Exceptions:** Caught error rate, stack traces, and affected routes/components.
2. **API Error Rates & Status Codes (`4xx` / `5xx`):** Frequency of `400` validation errors, `401` auth expirations, `409` out-of-stock checkout conflicts, and `500` server failures.
3. **Checkout & Stock Contention Metrics:** Order placement success vs. `409` out-of-stock rate and cart abandonment after stock conflicts.