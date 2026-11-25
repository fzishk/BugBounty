import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { db, setStock } from '../../mocks/db';
import { cartWith, inStockProduct, renderApp, signedInState } from '../../test/renderApp';

describe('checkout', () => {
  it('places an order, shows the confirmation, empties the cart and reduces stock', async () => {
    const p = inStockProduct(3);
    const stockBefore = p.stock;
    const { user, store } = renderApp('/checkout', { ...signedInState(), ...cartWith(p.id, 2) });

    await user.click(await screen.findByRole('button', { name: /place order/i }));

    expect(await screen.findByRole('heading', { name: /your order is in/i })).toBeInTheDocument();
    expect(screen.getByText(p.name, { exact: false })).toBeInTheDocument();
    expect(store.getState().cart.lines).toEqual([]);
    expect(db.productsById.get(p.id)?.stock).toBe(stockBefore - 2);
  });

  it('names the product that ran out when the server answers 409', async () => {
    const p = inStockProduct(3);
    const { user } = renderApp('/checkout', { ...signedInState(), ...cartWith(p.id, 3) });
    setStock(p.id, 1); // someone else bought it in the meantime

    await user.click(await screen.findByRole('button', { name: /place order/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(`${p.name} only has 1 left`);
    expect(screen.queryByText(/OUT_OF_STOCK/)).not.toBeInTheDocument();
    expect(screen.getByText(`1 × ${p.name}`)).toBeInTheDocument(); // cart corrected to what's available
  });

  it('creates only one order when Place order is clicked repeatedly', async () => {
    const p = inStockProduct(3);
    const { user } = renderApp('/checkout', { ...signedInState(), ...cartWith(p.id, 1) });

    const button = await screen.findByRole('button', { name: /place order/i });
    await Promise.all([user.click(button), user.click(button), user.click(button)]);

    await screen.findByRole('heading', { name: /your order is in/i });
    await waitFor(() => expect(db.orders.size).toBe(1));
  });

  it('returns the original order when a request is retried with the same idempotency key', async () => {
    const p = inStockProduct(3);
    const { token } = signedInState().session as { token: string };
    const send = () =>
      fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': 'retry-1',
        },
        body: JSON.stringify({ items: [{ productId: p.id, quantity: 1 }] }),
      }).then((r) => r.json() as Promise<{ id: string }>);

    const first = await send();
    const retry = await send();
    expect(retry.id).toBe(first.id);
    expect(db.orders.size).toBe(1);
    expect(db.productsById.get(p.id)?.stock).toBe(p.stock - 1);
  });
});
