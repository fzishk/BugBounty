/**
 * Fault-injection settings for the mock server. The Dev Tools panel edits these
 * so every error status and slow/out-of-order responses can be triggered on purpose.
 */

export type LatencyMode = 'instant' | 'normal' | 'slow' | 'out-of-order';
export type ForcedFailure = 'none' | '400' | '409' | '500';

export type ChaosSettings = {
  latency: LatencyMode;
  productsFail: boolean;
  productDetailFail: boolean;
  orderFailure: ForcedFailure;
};

const STORAGE_KEY = 'bazaar:chaos';

export const DEFAULT_CHAOS: ChaosSettings = {
  latency: 'normal',
  productsFail: false,
  productDetailFail: false,
  orderFailure: 'none',
};

function load(): ChaosSettings {
  if (import.meta.env.MODE === 'test') return { ...DEFAULT_CHAOS, latency: 'instant' };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw
      ? { ...DEFAULT_CHAOS, ...(JSON.parse(raw) as Partial<ChaosSettings>) }
      : DEFAULT_CHAOS;
  } catch {
    return DEFAULT_CHAOS;
  }
}

let settings: ChaosSettings = load();
const listeners = new Set<() => void>();

export const chaos = {
  get: (): ChaosSettings => settings,
  set(patch: Partial<ChaosSettings>): void {
    settings = { ...settings, ...patch };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage can be unavailable (private mode); settings still apply for this session.
    }
    listeners.forEach((listener) => listener());
  },
  reset(): void {
    chaos.set(
      import.meta.env.MODE === 'test' ? { ...DEFAULT_CHAOS, latency: 'instant' } : DEFAULT_CHAOS,
    );
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** How long a mocked response should take, in ms. */
export function latencyMs(): number {
  switch (settings.latency) {
    case 'instant':
      return 0;
    case 'normal':
      return 150 + Math.random() * 250;
    case 'slow':
      return 1500 + Math.random() * 500;
    case 'out-of-order':
      // Wide random spread means a later request often finishes before an earlier one.
      return 100 + Math.random() * 2400;
  }
}
