# The Bug Bazaar — Architectural Decision Log

## ADR-001: Integer Cents for All Monetary Values
- **Context:** Pricing and totals need arithmetic accuracy across product listings, cart calculations, and order totals without floating-point rounding inaccuracies (`0.1 + 0.2`).
- **Decision:** Store and pass all prices, unit prices, and totals as integer cents (for example, `14900` for `$149.00`), formatting to currency strings only at the UI display layer.

## ADR-002: Centralized API Client Layer (`src/api/client.ts`)
- **Context:** UI components should not depend directly on mock implementations, storage mechanics, or raw error shapes.
- **Decision:** Route all data calls through `apiClient` in `src/api/client.ts`, normalizing errors into a consistent `ApiError` envelope and isolating bearer token handling.

## ADR-003: Strict TypeScript Without Escape Hatches
- **Context:** The codebase migrated from `.jsx`/`.js` to `.tsx`/`.ts` while scaling to a 5,000-item catalog and full checkout flow.
- **Decision:** Enforce strict TypeScript across components, context providers, pages, and API modules without `any` or `@ts-ignore` to catch contract mismatches at compile time.