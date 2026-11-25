import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/db';
import { server } from '../../mocks/node';
import { renderApp } from '../../test/renderApp';

describe('product details', () => {
  it('never shows the previous product after switching quickly', async () => {
    // prod-0001 answers slowly, prod-0002 quickly, so the old response arrives last.
    server.use(
      http.get('*/api/products/:id', async ({ params }) => {
        const id = String(params.id);
        await delay(id === 'prod-0001' ? 300 : 10);
        return HttpResponse.json(db.productsById.get(id));
      }),
    );
    const { user } = renderApp('/products/prod-0001');
    await user.click(await screen.findByRole('link', { name: /next/i }));

    const second = db.productsById.get('prod-0002')!;
    const first = db.productsById.get('prod-0001')!;
    expect(await screen.findByRole('heading', { level: 1, name: second.name })).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 400)); // the slow, stale response lands now
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(second.name);
    expect(screen.queryByRole('heading', { level: 1, name: first.name })).not.toBeInTheDocument();
  });

  it('shows a Not Found page for an unknown product', async () => {
    renderApp('/products/prod-9999');
    expect(await screen.findByRole('heading', { name: /product not found/i })).toBeInTheDocument();
  });

  it('offers a retry after a server error', async () => {
    let fail = true;
    server.use(
      http.get('*/api/products/:id', ({ params }) =>
        fail
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'boom' } },
              { status: 500 },
            )
          : HttpResponse.json(db.productsById.get(String(params.id))),
      ),
    );
    const { user } = renderApp('/products/prod-0003');
    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.queryByText('boom')).not.toBeInTheDocument();

    fail = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: db.productsById.get('prod-0003')!.name,
      }),
    ).toBeInTheDocument();
  });
});
