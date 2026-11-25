import { describe, expect, it } from 'vitest';
import type { Product } from '../../api/contract';
import { CART_KEY, makeStore } from '../../app/store';
import { stockUpdated } from '../live/liveStockSlice';
import {
  itemAdded,
  itemRemoved,
  quantityChanged,
  selectCartCount,
  selectCartLines,
  selectCartTotal,
} from './cartSlice';

const duck: Product = {
  id: 'prod-0002',
  name: 'Classic Rubber Debug Duck',
  price: 1299,
  category: 'ducks',
  stock: 3,
  rating: 4.8,
  imageUrl: '/duck.svg',
};
const keyboard: Product = {
  ...duck,
  id: 'prod-0001',
  name: 'Clicky Keyboard',
  price: 12999,
  category: 'keyboards',
  stock: 10,
};

describe('cart', () => {
  it('merges repeated adds into one line and derives the badge count', () => {
    const store = makeStore({});
    store.dispatch(itemAdded({ product: duck }));
    store.dispatch(itemAdded({ product: duck }));
    store.dispatch(itemAdded({ product: keyboard }));
    expect(selectCartLines(store.getState())).toHaveLength(2);
    expect(selectCartCount(store.getState())).toBe(3);
  });

  it('never lets a quantity go above the stock', () => {
    const store = makeStore({});
    store.dispatch(itemAdded({ product: duck, quantity: 10 }));
    expect(selectCartCount(store.getState())).toBe(3);
    store.dispatch(quantityChanged({ productId: duck.id, quantity: 99 }));
    expect(selectCartCount(store.getState())).toBe(3);
  });

  it('does not add a sold-out product', () => {
    const store = makeStore({});
    store.dispatch(itemAdded({ product: { ...duck, stock: 0 } }));
    expect(selectCartLines(store.getState())).toEqual([]);
  });

  it('computes the total in integer cents and removes lines', () => {
    const store = makeStore({});
    store.dispatch(itemAdded({ product: duck, quantity: 2 }));
    store.dispatch(itemAdded({ product: keyboard }));
    expect(selectCartTotal(store.getState())).toBe(2 * 1299 + 12999);
    store.dispatch(itemRemoved(keyboard.id));
    expect(selectCartTotal(store.getState())).toBe(2598);
  });

  it('lowers quantities when live stock drops, and keeps sold-out lines visible', () => {
    const store = makeStore({});
    store.dispatch(itemAdded({ product: keyboard, quantity: 5 }));
    store.dispatch(itemAdded({ product: duck, quantity: 2 }));
    store.dispatch(
      stockUpdated([
        { productId: keyboard.id, stock: 2 },
        { productId: duck.id, stock: 0 },
      ]),
    );
    const lines = selectCartLines(store.getState());
    expect(lines.find((l) => l.productId === keyboard.id)?.quantity).toBe(2);
    expect(lines.find((l) => l.productId === duck.id)?.stock).toBe(0);
  });

  it('survives a reload through localStorage', () => {
    const first = makeStore({});
    first.dispatch(itemAdded({ product: duck, quantity: 2 }));
    expect(window.localStorage.getItem(CART_KEY)).toContain(duck.id);

    const afterReload = makeStore(); // default: load persisted state
    expect(selectCartCount(afterReload.getState())).toBe(2);
  });
});
