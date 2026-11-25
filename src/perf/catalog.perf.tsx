/**
 * Before/after measurements for docs/performance.md. Run with `npm run perf`.
 * "Before" versions are the naive implementations, kept here only to measure against.
 * Timings come from jsdom, so compare them relative to each other, not as absolute browser numbers.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { memo, Profiler, useState } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Product } from '../api/contract';
import { useAppSelector } from '../app/hooks';
import { makeStore } from '../app/store';
import { ProductCard } from '../features/catalog/ProductCard';
import { VirtualProductGrid } from '../features/catalog/VirtualProductGrid';
import { selectLiveStock, stockUpdated } from '../features/live/liveStockSlice';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { seedProducts } from '../mocks/db';

const products = seedProducts(480); // 10 pages of 48: what a user has after scrolling a while
const results: string[] = [];
const report = (line: string) => {
  results.push(line);
  console.log(`[perf] ${line}`);
};

function measure(ui: React.ReactElement) {
  const store = makeStore({});
  let commitMs = 0;
  const started = performance.now();
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <Profiler id="m" onRender={(_id, _phase, actual) => (commitMs += actual)}>
          {ui}
        </Profiler>
      </MemoryRouter>
    </Provider>,
  );
  const wallMs = performance.now() - started;
  return { store, view, commitMs, wallMs, domNodes: view.container.querySelectorAll('*').length };
}

describe('Fix 1: rendering a long product list', () => {
  it('plain grid vs virtualized grid', () => {
    const before = measure(
      <div>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>,
    );
    before.view.unmount();
    const after = measure(
      <VirtualProductGrid
        products={products}
        hasMore={false}
        loadingMore={false}
        onLoadMore={() => undefined}
      />,
    );
    report(
      `List render, 480 products: before ${before.commitMs.toFixed(0)} ms / ${before.domNodes} DOM nodes; ` +
        `after ${after.commitMs.toFixed(0)} ms / ${after.domNodes} DOM nodes`,
    );
    expect(after.domNodes).toBeLessThan(before.domNodes);
  });
});

describe('Fix 2: one request per keystroke', () => {
  function SearchProbe({ debounce, onQuery }: { debounce: boolean; onQuery: (q: string) => void }) {
    const [value, setValue] = useState('');
    const debounced = useDebouncedValue(value, 300);
    const query = debounce ? debounced : value;
    const [last, setLast] = useState('');
    if (query !== last) {
      setLast(query);
      if (query) onQuery(query);
    }
    return <input aria-label="q" value={value} onChange={(e) => setValue(e.target.value)} />;
  }

  async function typeAndCount(debounce: boolean) {
    const queries: string[] = [];
    const view = render(<SearchProbe debounce={debounce} onQuery={(q) => queries.push(q)} />);
    const input = screen.getByLabelText('q');
    let typed = '';
    for (const ch of 'mechanical keyboard') {
      typed += ch;
      fireEvent.change(input, { target: { value: typed } });
      await act(() => new Promise((r) => setTimeout(r, 60))); // ~fast typist, 60 ms per key
    }
    await act(() => new Promise((r) => setTimeout(r, 350)));
    view.unmount();
    return queries.length;
  }

  it('requests sent while typing "mechanical keyboard"', async () => {
    const before = await typeAndCount(false);
    const after = await typeAndCount(true);
    report(`Search requests for 19 keystrokes: before ${before}, after ${after}`);
    expect(after).toBe(1);
  });
});

describe('Optimization: memoized cards with per-card selectors', () => {
  let renders = 0;

  /** Before: not memoized, reads the whole live-stock map. */
  function NaiveCard({ product }: { product: Product }) {
    renders += 1;
    const live = useAppSelector((s) => s.liveStock.byId);
    return <div>{live[product.id] ?? product.stock}</div>;
  }

  /** After: the same pattern ProductCard uses (React.memo + a selector for this product only). */
  const MemoCard = memo(function MemoCard({ product }: { product: Product }) {
    renders += 1;
    const live = useAppSelector((s) => selectLiveStock(s, product.id));
    return <div>{live ?? product.stock}</div>;
  });

  function rendersForOneTick(Card: React.ComponentType<{ product: Product }>) {
    const store = makeStore({});
    const list = products.slice(0, 48);
    function Grid() {
      // The page re-renders on every tick as well (it shows the connection status).
      useAppSelector((s) => s.liveStock);
      return (
        <>
          {list.map((p) => (
            <Card key={p.id} product={p} />
          ))}
        </>
      );
    }
    const view = render(
      <Provider store={store}>
        <Grid />
      </Provider>,
    );
    renders = 0;
    act(() => {
      store.dispatch(stockUpdated([{ productId: list[0]!.id, stock: 1 }]));
    });
    view.unmount();
    return renders;
  }

  it('card renders caused by one live stock update (48 cards on screen)', () => {
    const before = rendersForOneTick(NaiveCard);
    const after = rendersForOneTick(MemoCard);
    report(`Card re-renders per live stock tick: before ${before}, after ${after}`);
    expect(after).toBeLessThan(before);
  });
});
