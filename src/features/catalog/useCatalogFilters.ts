import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  isCategory,
  isSortOption,
  type Category,
  type ProductQuery,
  type SortOption,
} from '../../api/contract';

export type CatalogFilters = {
  search: string;
  category: Category | null;
  sort: SortOption;
  inStock: boolean;
};

/** Parses untrusted URL params into valid filters (unknown values fall back to defaults). */
export function parseFilters(params: URLSearchParams): CatalogFilters {
  const category = params.get('category');
  const sort = params.get('sort');
  return {
    search: params.get('q') ?? '',
    category: isCategory(category) ? category : null,
    sort: isSortOption(sort) ? sort : 'featured',
    inStock: params.get('inStock') === '1',
  };
}

/** Serializes filters with a fixed key order and no defaults, so equal views share one URL. */
export function serializeFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('q', filters.search.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.sort !== 'featured') params.set('sort', filters.sort);
  if (filters.inStock) params.set('inStock', '1');
  return params;
}

export function toProductQuery(filters: CatalogFilters): ProductQuery {
  return {
    search: filters.search.trim() || undefined,
    category: filters.category ?? undefined,
    sort: filters.sort,
    inStock: filters.inStock || undefined,
  };
}

/**
 * The URL is the single source of truth for catalog filters: refresh keeps them,
 * a copied link reproduces the view, and Back/Forward step through filter changes.
 */
export function useCatalogFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);

  const setFilters = useCallback(
    (patch: Partial<CatalogFilters>) => {
      setParams(
        (current) => {
          const next = { ...parseFilters(current), ...patch };
          return serializeFilters(next);
        },
        // Keep typing out of history: refining an existing search replaces the entry.
        { replace: 'search' in patch && Boolean(params.get('q')) && Boolean(patch.search) },
      );
    },
    [params, setParams],
  );

  const clearFilters = useCallback(() => setParams(new URLSearchParams()), [setParams]);

  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.sort !== 'featured' ? 1 : 0);

  return { filters, setFilters, clearFilters, activeCount };
}
