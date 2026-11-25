import { toAppError, type AppError } from './errors';

/**
 * The status of a request as one discriminated union, so "loading AND error"
 * or "success without data" cannot be represented.
 */
export type RequestState<T> =
  { status: 'loading' } | { status: 'error'; error: AppError } | { status: 'success'; data: T };

type QueryLike<T> = { currentData?: T; isError: boolean; error?: unknown };

/** Adapter from RTK Query's flags to RequestState. Uses `currentData` so data
 *  from a previous argument (an old search, a different product) is never shown. */
export function toRequestState<T>(query: QueryLike<T>): RequestState<T> {
  if (query.isError) return { status: 'error', error: toAppError(query.error) };
  if (query.currentData !== undefined) return { status: 'success', data: query.currentData };
  return { status: 'loading' };
}
