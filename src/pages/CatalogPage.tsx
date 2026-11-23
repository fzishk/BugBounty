import { useEffect, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useScrollTop } from '../hooks/useScrollTop';
import type { ApiError, Product, ProductCategory, SortOption } from '../types/bazaar';

const CATEGORY_OPTIONS: Array<{ value: 'all' | ProductCategory; label: string }> = [
  { value: 'all', label: 'All Categories' },
  { value: 'keyboards', label: 'Keyboards' },
  { value: 'ducks', label: 'Ducks' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'stickers', label: 'Stickers' },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

const PAGE_SIZE = 20;

function parseCategory(raw: string | null): 'all' | ProductCategory {
  if (raw === 'keyboards' || raw === 'ducks' || raw === 'coffee' || raw === 'stickers') {
    return raw;
  }
  return 'all';
}

function parseSort(raw: string | null): SortOption {
  if (raw === 'price-asc' || raw === 'price-desc' || raw === 'rating-desc') {
    return raw;
  }
  return 'featured';
}

function parsePage(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '1', 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export default function CatalogPage() {
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showBackToTop, scrollToTop } = useScrollTop(300);

  const urlSearch = searchParams.get('search') ?? '';
  const category = parseCategory(searchParams.get('category'));
  const sort = parseSort(searchParams.get('sort'));
  const page = parsePage(searchParams.get('page'));
  const inStockOnly = searchParams.get('inStock') === '1';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput, 200);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const updateParams = (updates: {
    search?: string;
    category?: 'all' | ProductCategory;
    sort?: SortOption;
    page?: number;
    inStock?: boolean;
  }) => {
    const next = new URLSearchParams(searchParams);

    const nextSearch = updates.search !== undefined ? updates.search : urlSearch;
    if (nextSearch.trim()) {
      next.set('search', nextSearch);
    } else {
      next.delete('search');
    }

    const nextCategory = updates.category !== undefined ? updates.category : category;
    if (nextCategory !== 'all') {
      next.set('category', nextCategory);
    } else {
      next.delete('category');
    }

    const nextSort = updates.sort !== undefined ? updates.sort : sort;
    if (nextSort !== 'featured') {
      next.set('sort', nextSort);
    } else {
      next.delete('sort');
    }

    const nextInStock = updates.inStock !== undefined ? updates.inStock : inStockOnly;
    if (nextInStock) {
      next.set('inStock', '1');
    } else {
      next.delete('inStock');
    }

    const nextPage = updates.page !== undefined ? updates.page : 1;
    if (nextPage > 1) {
      next.set('page', String(nextPage));
    } else {
      next.delete('page');
    }

    setSearchParams(next);
  };

  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      updateParams({ search: debouncedSearch, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    apiClient
      .getProducts({
        search: urlSearch,
        category,
        sort,
        page,
        pageSize: PAGE_SIZE,
        signal: controller.signal,
      })
      .then((res) => {
        if (!active) return;
        const visibleItems = inStockOnly ? res.items.filter((item) => item.stock > 0) : res.items;
        setProducts(visibleItems);
        setTotal(inStockOnly ? visibleItems.length : res.total);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        const apiErr = err as ApiError;
        setError(
          apiErr?.error
            ? apiErr
            : { error: { code: 'INTERNAL_ERROR', message: 'Failed to load catalog.' } },
        );
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [urlSearch, category, sort, page, inStockOnly, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateParams({ category: e.target.value as 'all' | ProductCategory, page: 1 });
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateParams({ sort: e.target.value as SortOption, page: 1 });
  };

  const handleInStockChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateParams({ inStock: e.target.checked, page: 1 });
  };

  return (
    <section>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr auto',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <input
          type="search"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search 5,000 dev gear items (e.g. keyboard, duck, prod-0042)..."
          aria-label="Search products"
          style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />

        <select
          value={category}
          onChange={handleCategoryChange}
          aria-label="Filter by category"
          style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={handleSortChange}
          aria-label="Sort products"
          style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '14px' }}>
          <input type="checkbox" checked={inStockOnly} onChange={handleInStockChange} />
          In stock only
        </label>
      </div>

      <p style={{ fontSize: '13px', color: '#52525b', marginBottom: '14px' }} role="status">
        Showing {products.length} of {total} items (Page {page} of {totalPages})
      </p>

      {loading && <p role="status">Loading catalog...</p>}

      {!loading && error && (
        <div
          role="alert"
          style={{
            padding: '14px',
            border: '1px solid #fca5a5',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: '0 0 8px' }}>
            <strong>{error.error.code}:</strong> {error.error.message}
          </p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div
          style={{
            padding: '24px',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 10px' }}>No products matched your current filters.</p>
          <button type="button" onClick={() => setSearchParams(new URLSearchParams())}>
            Clear Filters
          </button>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div
            role="list"
            aria-label="Product catalog"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {products.map((product) => (
              <div key={product.id} role="listitem">
                <ProductCard product={product} onAddToCart={(p) => addItem(p, 1)} />
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
            }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: Math.max(1, page - 1) })}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '14px' }}>
              Page <strong>{page}</strong> / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #111827',
            backgroundColor: '#111827',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          ↑ Back to Top
        </button>
      )}
    </section>
  );
}
