import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../api/contract';

export type SessionState =
  | { status: 'signed-out'; reason: 'initial' | 'logout' | 'expired' }
  | { status: 'signed-in'; token: string; user: User };

const initialState = { status: 'signed-out', reason: 'initial' } as SessionState;

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    signedIn: (_state, action: PayloadAction<{ token: string; user: User }>) => ({
      status: 'signed-in',
      ...action.payload,
    }),
    signedOut: () => ({ status: 'signed-out', reason: 'logout' }) as SessionState,
    /** Dispatched by the base query whenever the server answers 401 to an authenticated call. */
    sessionExpired: () => ({ status: 'signed-out', reason: 'expired' }) as SessionState,
  },
  selectors: {
    selectSession: (state) => state,
    selectToken: (state) => (state.status === 'signed-in' ? state.token : null),
    selectUser: (state) => (state.status === 'signed-in' ? state.user : null),
    selectIsSignedIn: (state) => state.status === 'signed-in',
  },
});

export const { signedIn, signedOut, sessionExpired } = sessionSlice.actions;
export const { selectSession, selectToken, selectUser, selectIsSignedIn } = sessionSlice.selectors;
export default sessionSlice;
