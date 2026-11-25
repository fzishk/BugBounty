/**
 * Loaded before any other test module (see vite.config.ts setupFiles).
 *
 * jsdom replaces AbortSignal with its own class, and Node's built-in Request rejects it
 * ("Expected signal to be an instance of AbortSignal"). In tests only, drop signals that
 * Node cannot accept. RTK Query still tracks aborts on its own side, so app behaviour is unchanged.
 */
const NativeRequest = globalThis.Request;

function nodeAccepts(signal: AbortSignal): boolean {
  try {
    new NativeRequest('http://localhost', { signal });
    return true;
  } catch {
    return false;
  }
}

globalThis.Request = class TestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const usable = !init?.signal || nodeAccepts(init.signal);
    super(input, usable ? init : { ...init, signal: null });
  }
} as typeof Request;

export {};
