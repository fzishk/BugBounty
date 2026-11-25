import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { ApiError } from '../api/contract';

/**
 * Every failure the UI can show. Components switch on `kind` and pick their own copy,
 * so raw server messages never reach the screen.
 */
export type AppError =
  | { kind: 'validation'; fields: Record<string, string> }
  | { kind: 'unauthorized' }
  | { kind: 'not-found' }
  | { kind: 'out-of-stock'; productId: string | null; available: number | null }
  | { kind: 'server' }
  | { kind: 'network' };

function isApiErrorBody(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const inner = (value as { error: unknown }).error;
  return typeof inner === 'object' && inner !== null && 'code' in inner;
}

function isFetchBaseQueryError(value: unknown): value is FetchBaseQueryError {
  return typeof value === 'object' && value !== null && 'status' in value;
}

/** The single adapter from transport errors to UI errors. */
export function toAppError(error: FetchBaseQueryError | SerializedError | unknown): AppError {
  if (!isFetchBaseQueryError(error)) return { kind: 'network' };
  if (typeof error.status !== 'number') {
    // FETCH_ERROR, TIMEOUT_ERROR, PARSING_ERROR, CUSTOM_ERROR
    return { kind: 'network' };
  }
  const body = isApiErrorBody(error.data) ? error.data.error : undefined;
  switch (error.status) {
    case 400:
      return { kind: 'validation', fields: body?.details ?? {} };
    case 401:
      return { kind: 'unauthorized' };
    case 404:
      return { kind: 'not-found' };
    case 409: {
      const available = body?.details?.available;
      return {
        kind: 'out-of-stock',
        productId: body?.details?.productId ?? null,
        available: available === undefined ? null : Number(available),
      };
    }
    default:
      return { kind: 'server' };
  }
}

/** Generic copy for each error kind. Pages may override with something more specific. */
export const ERROR_COPY: Record<AppError['kind'], { title: string; description: string }> = {
  validation: {
    title: 'Please check the highlighted fields',
    description: 'Some of the information you entered needs a fix.',
  },
  unauthorized: {
    title: 'Please sign in again',
    description: 'Your session has ended. Sign in to continue where you left off.',
  },
  'not-found': {
    title: 'We couldn’t find that',
    description: 'It may have been removed, or the link might be wrong.',
  },
  'out-of-stock': {
    title: 'Something in your cart sold out',
    description: 'Update your cart to continue.',
  },
  server: {
    title: 'Something went wrong on our side',
    description: 'This is usually temporary. Please try again.',
  },
  network: {
    title: 'You seem to be offline',
    description: 'Check your connection and try again.',
  },
};

const FIELD_COPY: Record<string, string> = {
  required: 'This field is required.',
  invalid: 'Enter a valid value.',
  invalid_quantity: 'Choose a quantity of at least 1.',
  unknown_product: 'This product is no longer available.',
};

export function fieldMessage(field: string, reason: string): string {
  if (field === 'email' && reason === 'invalid')
    return 'Enter a valid email address, like name@example.com.';
  return FIELD_COPY[reason] ?? 'Please check this field.';
}
