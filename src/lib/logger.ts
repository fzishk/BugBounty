/**
 * Minimal error monitoring. In production this would forward to Sentry/Datadog;
 * here it logs to the console and keeps the last few errors so the Dev Tools panel can show them.
 */
export type LoggedError = {
  id: string;
  at: string;
  message: string;
  source: string;
  stack?: string;
};

const MAX_ENTRIES = 20;
const entries: LoggedError[] = [];
const listeners = new Set<() => void>();

export function logError(error: unknown, source: string, extra?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const entry: LoggedError = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    message: err.message,
    source,
    stack: err.stack,
  };
  entries.unshift(entry);
  entries.length = Math.min(entries.length, MAX_ENTRIES);
  // One structured line that a log collector could ingest.
  console.error('[bazaar:error]', { source, message: entry.message, ...extra }, err);
  listeners.forEach((listener) => listener());
}

export function getLoggedErrors(): readonly LoggedError[] {
  return entries;
}

export function subscribeToErrors(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Catches errors that happen outside React rendering (event handlers, promises). */
export function installGlobalErrorHandlers(): () => void {
  const onError = (event: ErrorEvent) => logError(event.error ?? event.message, 'window.onerror');
  const onRejection = (event: PromiseRejectionEvent) =>
    logError(event.reason, 'unhandledrejection');
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
