import { createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import { bazaarApi } from '../../api/bazaarApi';

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

type LiveStockState = {
  /** Latest stock pushed by the server, keyed by product id. Overrides cached REST data. */
  byId: Record<string, number>;
  connection: ConnectionStatus;
};

function withoutKeys(record: Record<string, number>, keys: string[]): Record<string, number> {
  const drop = new Set(keys);
  return Object.fromEntries(Object.entries(record).filter(([key]) => !drop.has(key)));
}

const initialState: LiveStockState = { byId: {}, connection: 'idle' };

const liveStockSlice = createSlice({
  name: 'liveStock',
  initialState,
  reducers: {
    stockUpdated: (state, action: PayloadAction<Array<{ productId: string; stock: number }>>) => {
      for (const { productId, stock } of action.payload) state.byId[productId] = stock;
    },
    connectionChanged: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connection = action.payload;
    },
  },
  extraReducers: (builder) => {
    // When fresh REST data arrives it is newer than any pushed value, so drop the override.
    builder.addMatcher(bazaarApi.endpoints.getProduct.matchFulfilled, (state, action) => {
      state.byId = withoutKeys(state.byId, [action.payload.id]);
    });
    builder.addMatcher(
      isAnyOf(
        bazaarApi.endpoints.getProducts.matchFulfilled,
        bazaarApi.endpoints.getProductPage.matchFulfilled,
      ),
      (state, action) => {
        const items =
          'pages' in action.payload
            ? action.payload.pages.flatMap((p) => p.items)
            : action.payload.items;
        state.byId = withoutKeys(
          state.byId,
          items.map((item) => item.id),
        );
      },
    );
  },
  selectors: {
    selectLiveStock: (state, productId: string): number | undefined => state.byId[productId],
    selectConnection: (state) => state.connection,
  },
});

export const { stockUpdated, connectionChanged } = liveStockSlice.actions;
export const { selectLiveStock, selectConnection } = liveStockSlice.selectors;
export default liveStockSlice;
