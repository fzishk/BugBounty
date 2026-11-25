import { useEffect, useMemo, useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { Product } from '../../api/contract';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { useElementWidth } from '../../hooks/useElementWidth';
import { ProductCard } from './ProductCard';

type Props = {
  products: Product[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onVisibleChange?: (productIds: string[]) => void;
};

const GAP = 20;
const ROW_ESTIMATE = 440;

function columnsFor(width: number): number {
  if (width >= 1100) return 4;
  if (width >= 760) return 3;
  if (width >= 460) return 2;
  return 1;
}

/**
 * Renders only the rows near the viewport (about 4-6 rows) instead of up to 5,000 cards.
 * Rows are measured after render, so cards may have different heights.
 */
export function VirtualProductGrid({
  products,
  hasMore,
  loadingMore,
  onLoadMore,
  onVisibleChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);
  const columns = columnsFor(width);
  const rowCount = Math.ceil(products.length / columns);

  const virtualizer = useWindowVirtualizer({
    count: hasMore ? rowCount + 1 : rowCount, // +1 row for the "loading more" skeletons
    estimateSize: () => ROW_ESTIMATE,
    overscan: 2,
    gap: GAP,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const lastRowIndex = virtualRows.at(-1)?.index ?? 0;

  // Infinite scroll: ask for the next page when the skeleton row comes into range.
  useEffect(() => {
    if (hasMore && !loadingMore && lastRowIndex >= rowCount - 1) onLoadMore();
  }, [hasMore, loadingMore, lastRowIndex, rowCount, onLoadMore]);

  const firstRow = virtualRows[0]?.index ?? 0;
  const visibleIds = useMemo(
    () => products.slice(firstRow * columns, (lastRowIndex + 1) * columns).map((p) => p.id),
    [products, firstRow, lastRowIndex, columns],
  );
  const visibleKey = visibleIds.join(',');
  useEffect(() => {
    onVisibleChange?.(visibleKey ? visibleKey.split(',') : []);
  }, [visibleKey, onVisibleChange]);

  const scrollMargin = virtualizer.options.scrollMargin;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualRows.map((row) => {
        const isLoaderRow = row.index >= rowCount;
        const rowProducts = products.slice(row.index * columns, row.index * columns + columns);
        return (
          <div
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 grid w-full"
            style={{
              transform: `translateY(${row.start - scrollMargin}px)`,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: GAP,
            }}
          >
            {isLoaderRow
              ? Array.from({ length: columns }, (_, i) => <ProductCardSkeleton key={i} />)
              : rowProducts.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    eager={row.index === 0 && i < 4}
                  />
                ))}
          </div>
        );
      })}
    </div>
  );
}
