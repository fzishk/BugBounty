import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { sessionExpired } from '../features/auth/sessionSlice';
import type { SessionState } from '../features/auth/sessionSlice';
import { config } from '../lib/config';

type StateWithSession = { session: SessionState };

const rawBaseQuery = fetchBaseQuery({
  // Resolve against the page origin so it also works in Node (tests), where relative URLs fail.
  baseUrl: new URL(config.apiBaseUrl, window.location.origin).toString(),
  prepareHeaders: (headers, { getState }) => {
    const session = (getState() as StateWithSession).session;
    if (session.status === 'signed-in') headers.set('Authorization', `Bearer ${session.token}`);
    return headers;
  },
});

/**
 * Every request in the app goes through here. On a 401 for a request that carried a token,
 * the session is cleared once, centrally, instead of in each page.
 */
export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const session = (api.getState() as StateWithSession).session;
    if (session.status === 'signed-in') api.dispatch(sessionExpired());
  }
  return result;
};
