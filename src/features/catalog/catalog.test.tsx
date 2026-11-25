import { screen, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { ProductListResponse } from '../../api/contract';
import { db } from '../../mocks/db';
import { server } from '../../mocks/node';
import { renderApp } from '../../test/renderApp';

const countOf = (predicate: (p: (typeof db.products)[number]) => boolean) =>
  db.products.filter(predicate).length.toLocaleString();

describe('catalog filters', () => {
  it('filters by category and stock, puts it in the URL, and clears', async () => {
    const { user } = renderApp('/shop');
    expect(await screen.findByText('5,000')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /rubber ducks/i }));
    await user.click(screen.getByRole('checkbox', { name: /in stock only/i }));
    const expected = countOf((p) => p.category === 'ducks' && p.stock > 0);
    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(await screen.findByText('5,000')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /all products/i })).toBeChecked();
  });

  it('rebuilds the same view from a copied link', async () => {
    renderApp('/shop?category=coffee&inStock=1&sort=price-asc');
    expect(
      await screen.findByText(countOf((p) => p.category === 'coffee' && p.stock > 0)),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /coffee/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /in stock only/i })).toBeChecked();
    expect(screen.getByRole('combobox', { name: /sort by/i })).toHaveValue('price-asc');
  });

  it('shows an empty state with a way out when nothing matches', async () => {
    const { user } = renderApp('/shop?q=definitely-not-a-product');
    expect(await screen.findByText(/no products match/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('5,000')).toBeInTheDocument();
  });

  it('always shows results for the latest search, even if an older response arrives last', async () => {
    // "duck" is answered slowly, "keyboard" quickly: the duck response lands after the keyboard one.
    server.use(
      http.get('*/api/products', async ({ request }) => {
        const q = new URL(request.url).searchParams.get('search') ?? '';
        await delay(q === 'duck' ? 400 : 20);
        const items = db.products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 48);
        return HttpResponse.json<ProductListResponse>({ items, total: items.length });
      }),
    );
    const { user } = renderApp('/shop');
    const box = await screen.findByRole('searchbox', { name: /search products/i });

    await user.type(box, 'duck');
    await new Promise((r) => setTimeout(r, 350)); // debounce fires, slow "duck" request starts
    await user.clear(box);
    await user.type(box, 'keyboard');

    await waitFor(() =>
      expect(screen.getByTestId('result-count')).toHaveTextContent(/for “keyboard”/),
    );
    await new Promise((r) => setTimeout(r, 500)); // let the stale "duck" response arrive
    const names = screen.getAllByRole('article').map((a) => a.textContent ?? '');
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => /keyboard/i.test(n))).toBe(true);
    expect(names.some((n) => /Rubber Ducks/.test(n))).toBe(false);
  });
});
