import { useEffect, useMemo, useRef } from 'react';
import { bazaarApi } from '../../api/bazaarApi';
import type { Product } from '../../api/contract';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toAppError } from '../../lib/errors';
import type { RequestState } from '../../lib/requestState';

/**
 * Loads one product through the shared cache, and cleans up after itself:
 * - switching to another product aborts the request for the previous one,
 * - leaving the page aborts anything still in flight,
 * - a cached product is shown instantly with no request at all.
 */
export function useProduct(id: string): { state: RequestState<Product>; retry: () => void } {
  const dispatch = useAppDispatch();
  const latestId = useRef(id);
  latestId.current = id;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const request = dispatch(bazaarApi.endpoints.getProduct.initiate(id));
    return () => {
      request.unsubscribe();
      // Checked after React finishes this commit, so StrictMode's dev-only remount
      // (same id, still mounted) does not cancel a request the page still needs.
      queueMicrotask(() => {
        if (!mounted.current || latestId.current !== id) request.abort();
      });
    };
  }, [dispatch, id]);

  const select = useMemo(() => bazaarApi.endpoints.getProduct.select(id), [id]);
  const entry = useAppSelector(select);

  const state: RequestState<Product> =
    entry.data && entry.originalArgs === id
      ? { status: 'success', data: entry.data }
      : entry.isError && (entry.error as { name?: string } | undefined)?.name !== 'AbortError'
        ? { status: 'error', error: toAppError(entry.error) }
        : { status: 'loading' };

  const retry = () => {
    // The effect above already holds a subscription, so this one can be released immediately.
    dispatch(bazaarApi.endpoints.getProduct.initiate(id, { forceRefetch: true })).unsubscribe();
  };
  return { state, retry };
}
