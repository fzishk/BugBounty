import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { SORT_OPTIONS, type SortOption } from '../../api/contract';
import { useGetProductsInfiniteQuery } from '../../api/bazaarApi';
import { EmptyState, ErrorState } from '../../components/feedback/StateViews';
import { BackToTop } from '../../components/ui/BackToTop';
import { Button } from '../../components/ui/Button';
import { LiveIndicator } from '../../components/ui/LiveIndicator';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { toRequestState } from '../../lib/requestState';
import { useLiveStock } from '../live/useLiveStock';
import { CATEGORY_META, SORT_LABELS } from './categories';
import { FiltersPanel } from './FiltersPanel';
import { toProductQuery, useCatalogFilters } from './useCatalogFilters';
import { VirtualProductGrid } from './VirtualProductGrid';

export default function CatalogPage() {
  const { filters, setFilters, clearFilters, activeCount } = useCatalogFilters();

  // The input has its own draft so typing feels instant; the URL (and the request) follow after a pause.
  const [draft, setDraft] = useState(filters.search);
  const debouncedDraft = useDebouncedValue(draft, 300);
  useEffect(() => {
    if (debouncedDraft !== filters.search) setFilters({ search: debouncedDraft });
    // Only react to the debounced value; filters.search changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft]);
  useEffect(() => {
    // URL changed from outside (Back button, Clear filters, header search): update the box.
    if (filters.search !== debouncedDraft) setDraft(filters.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const query = useMemo(() => toProductQuery(filters), [filters]);
  const result = useGetProductsInfiniteQuery(query);
  // `currentData` belongs to *these* filters only. A slow response for an older query is
  // cached under its own key and never shown here, which is how the race condition is avoided.
  const state = toRequestState(result);
  const pages = result.currentData?.pages;
  const products = useMemo(() => pages?.flatMap((page) => page.items) ?? [], [pages]);
  const total = state.status === 'success' ? (state.data.pages[0]?.total ?? 0) : null;

  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  useLiveStock(useDebouncedValue(visibleIds, 400));

  const { fetchNextPage } = result;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  const heading = filters.category ? CATEGORY_META[filters.category].label : 'All products';
  const tagline = filters.category
    ? CATEGORY_META[filters.category].tagline
    : 'Everything a developer needs, from rubber ducks to split keyboards.';
  useDocumentTitle(filters.search ? `“${filters.search}” in ${heading}` : heading);

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{heading}</h1>
          <p className="mt-1 text-slate-600">{tagline}</p>
        </div>
        <LiveIndicator />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
          <FiltersPanel filters={filters} onChange={setFilters} />
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <h2 id="results-heading" className="sr-only">
            Results
          </h2>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search by name or product ID"
                aria-label="Search products"
                className="focus:ring-brand-600 h-11 w-full rounded-lg bg-white pr-3 pl-9 text-sm ring-1 ring-slate-300 placeholder:text-slate-500 focus:ring-2 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="whitespace-nowrap">Sort by</span>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ sort: e.target.value as SortOption })}
                className="focus:ring-brand-600 h-11 rounded-lg bg-white px-3 text-sm ring-1 ring-slate-300 focus:ring-2 focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-5 flex min-h-9 flex-wrap items-center justify-between gap-3">
            <p role="status" data-testid="result-count" className="text-sm text-slate-700">
              {total === null ? (
                'Loading products…'
              ) : (
                <>
                  <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>{' '}
                  {total === 1 ? 'product' : 'products'}
                  {filters.search && (
                    <>
                      {' '}
                      for “<span className="font-medium">{filters.search}</span>”
                    </>
                  )}
                </>
              )}
            </p>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-4" aria-hidden="true" />
                Clear filters ({activeCount})
              </Button>
            )}
          </div>

          {state.status === 'loading' && (
            <div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              aria-busy="true"
              aria-label="Loading products"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}
          {state.status === 'error' && (
            <ErrorState error={state.error} onRetry={() => void result.refetch()} />
          )}
          {state.status === 'success' && products.length === 0 && (
            <EmptyState
              title="No products match these filters"
              description="Try a different search term, or clear the filters to see everything."
              action={<Button onClick={clearFilters}>Clear filters</Button>}
            />
          )}
          {state.status === 'success' && products.length > 0 && (
            <VirtualProductGrid
              products={products}
              hasMore={Boolean(result.hasNextPage)}
              loadingMore={result.isFetchingNextPage}
              onLoadMore={loadMore}
              onVisibleChange={setVisibleIds}
            />
          )}
        </section>
      </div>
      <BackToTop />
    </div>
  );
}
