import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export type Toast = { id: string; tone: 'success' | 'info' | 'error'; message: string };

const toastSlice = createSlice({
  name: 'toasts',
  initialState: [] as Toast[],
  reducers: {
    toastShown: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.push(action.payload);
        if (state.length > 3) state.shift();
      },
      prepare: (tone: Toast['tone'], message: string) => ({
        payload: { id: nanoid(), tone, message },
      }),
    },
    toastDismissed: (state, action: PayloadAction<string>) =>
      state.filter((toast) => toast.id !== action.payload),
  },
  selectors: {
    selectToasts: (state) => state,
  },
});

export const { toastShown, toastDismissed } = toastSlice.actions;
export const { selectToasts } = toastSlice.selectors;
export default toastSlice;
