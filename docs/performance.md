# Performance & Optimization Notes

## Measured & Addressed Bottlenecks
1. **Excessive Filtering While Typing Search Queries (`D2-2` / `D4-2`):**
   - **Before:** Every keystroke in the search box immediately triggered a catalog query and URL update.
   - **After:** `useDebouncedValue` batches rapid input changes before updating search state, reducing redundant queries while typing.
2. **Stale / Out-of-Order Responses During Rapid Filter Changes (`D2-6` / `D4-2`):**
   - **Before:** Fast filter/search changes could allow an earlier slow request to overwrite newer results.
   - **After:** Each catalog/detail effect creates an `AbortController` and `active` flag, cancelling obsolete requests and ignoring stale responses on cleanup.

## Memoization & Virtualization Decisions (`D4-3`)
- **Kept:** Paginated rendering (`20` items per page) and `AbortController` cleanup keep DOM node counts small and responsive across the 5,000-item catalog.
- **Skipped / Removed:** Full list virtualization (`react-window`) was skipped because pagination already caps rendered cards per page, and wrapping every tiny inline handler in `useCallback` was avoided where readability would suffer without measurable render cost.