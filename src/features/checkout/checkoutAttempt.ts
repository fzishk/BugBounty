import type { CartLine } from '../cart/cartSlice';

const STORAGE_KEY = 'bazaar:checkout-attempt';

type Attempt = { key: string; fingerprint: string };

/** Same items + same quantities => same fingerprint. */
export function cartFingerprint(lines: CartLine[]): string {
  return lines
    .map((line) => `${line.productId}x${line.quantity}`)
    .sort()
    .join('|');
}

/**
 * One idempotency key per checkout attempt. Retries of the same cart (double click, retry after
 * a 500 or a timeout, even after a page reload) reuse the key, so the server returns the first
 * order instead of creating a second one. Changing the cart starts a new attempt.
 */
export function getAttemptKey(fingerprint: string): string {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Attempt) : null;
    if (saved?.fingerprint === fingerprint) return saved.key;
  } catch {
    // Fall through and create a new key.
  }
  const attempt: Attempt = { key: crypto.randomUUID(), fingerprint };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // Without storage the key still protects retries within this page view.
  }
  return attempt.key;
}

export function finishAttempt(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
