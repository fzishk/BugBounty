import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { bazaarApi } from '../api/bazaarApi';
import sessionSlice, { type SessionState } from '../features/auth/sessionSlice';
import cartSlice, { isCartState, type CartState } from '../features/cart/cartSlice';
import liveStockSlice from '../features/live/liveStockSlice';
import toastSlice from '../features/toast/toastSlice';
import { readJson, writeJson } from '../lib/storage';

const rootReducer = combineSlices(sessionSlice, cartSlice, liveStockSlice, toastSlice, bazaarApi);

export type RootState = ReturnType<typeof rootReducer>;

export const CART_KEY = 'bazaar:cart:v2';
export const SESSION_KEY = 'bazaar:session:v1';

type PersistedSession = Extract<SessionState, { status: 'signed-in' }>;

function isPersistedSession(value: unknown): value is PersistedSession {
  const v = value as PersistedSession | null;
  return v?.status === 'signed-in' && typeof v.token === 'string' && typeof v.user?.id === 'string';
}

/** Rebuilds client state saved by a previous visit (cart + session). */
export function loadPersistedState(): Partial<RootState> {
  const cart = readJson<CartState>(CART_KEY, isCartState);
  const session = readJson<PersistedSession>(SESSION_KEY, isPersistedSession);
  return {
    ...(cart ? { cart } : {}),
    ...(session ? { session } : {}),
  };
}

export function makeStore(preloadedState: Partial<RootState> = loadPersistedState()) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(bazaarApi.middleware),
  });

  // Persist cart and session whenever they change (reference equality keeps this cheap).
  let previous = store.getState();
  store.subscribe(() => {
    const next = store.getState();
    if (next.cart !== previous.cart) writeJson(CART_KEY, next.cart);
    if (next.session !== previous.session) {
      writeJson(SESSION_KEY, next.session.status === 'signed-in' ? next.session : null);
    }
    previous = next;
  });

  // Enables refetchOnFocus / refetchOnReconnect behaviour.
  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
