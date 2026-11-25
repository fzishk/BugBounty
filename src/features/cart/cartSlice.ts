import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../api/contract';
import { stockUpdated } from '../live/liveStockSlice';

export type CartLine = {
  productId: string;
  name: string;
  /** Integer cents, captured when added. The server re-prices at checkout. */
  price: number;
  imageUrl: string;
  category: Product['category'];
  /** Last known stock; quantity is always clamped to this. */
  stock: number;
  quantity: number;
};

export type CartState = { lines: CartLine[] };

const initialState: CartState = { lines: [] };

const clamp = (quantity: number, stock: number) =>
  Math.max(0, Math.min(Math.floor(quantity), stock));

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    itemAdded: (state, action: PayloadAction<{ product: Product; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;
      const line = state.lines.find((l) => l.productId === product.id);
      if (line) {
        line.stock = product.stock;
        line.price = product.price;
        line.quantity = clamp(line.quantity + quantity, product.stock);
      } else if (product.stock > 0) {
        state.lines.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          stock: product.stock,
          quantity: clamp(quantity, product.stock),
        });
      }
      state.lines = state.lines.filter((l) => l.quantity > 0);
    },
    quantityChanged: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const line = state.lines.find((l) => l.productId === action.payload.productId);
      if (!line) return;
      line.quantity = clamp(action.payload.quantity, line.stock);
      if (line.quantity === 0) state.lines = state.lines.filter((l) => l !== line);
    },
    itemRemoved: (state, action: PayloadAction<string>) => {
      state.lines = state.lines.filter((l) => l.productId !== action.payload);
    },
    /** After a 409 the server tells us the real stock for a line. */
    stockCorrected: (state, action: PayloadAction<{ productId: string; stock: number }>) => {
      const line = state.lines.find((l) => l.productId === action.payload.productId);
      if (!line) return;
      line.stock = action.payload.stock;
      line.quantity = clamp(line.quantity, line.stock);
      state.lines = state.lines.filter((l) => l.quantity > 0);
    },
    cartCleared: () => initialState,
  },
  extraReducers: (builder) => {
    // Live stock lowers quantities that no longer fit. A sold-out line is kept (not silently
    // removed) so the shopper sees "sold out" and checkout is blocked until they remove it.
    builder.addCase(stockUpdated, (state, action) => {
      for (const { productId, stock } of action.payload) {
        const line = state.lines.find((l) => l.productId === productId);
        if (!line) continue;
        line.stock = stock;
        if (stock > 0) line.quantity = Math.min(line.quantity, stock);
      }
    });
  },
});

export const { itemAdded, quantityChanged, itemRemoved, stockCorrected, cartCleared } =
  cartSlice.actions;
export default cartSlice;

type WithCart = { cart: CartState };

export const selectCartLines = (state: WithCart) => state.cart.lines;

/** Derived values: computed from lines, never stored. */
export const selectCartCount = createSelector([selectCartLines], (lines) =>
  lines.reduce((sum, line) => sum + line.quantity, 0),
);

export const selectCartTotal = createSelector([selectCartLines], (lines) =>
  lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
);

export const selectCartLine = (state: WithCart, productId: string) =>
  state.cart.lines.find((line) => line.productId === productId);

export const selectOverStockLines = createSelector([selectCartLines], (lines) =>
  lines.filter((line) => line.quantity > line.stock),
);

export function isCartState(value: unknown): value is CartState {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as CartState).lines))
    return false;
  return (value as CartState).lines.every(
    (line) =>
      typeof line.productId === 'string' &&
      typeof line.name === 'string' &&
      Number.isInteger(line.price) &&
      Number.isInteger(line.quantity) &&
      Number.isInteger(line.stock) &&
      line.quantity > 0,
  );
}
