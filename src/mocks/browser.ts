import { setupWorker } from 'msw/browser';
import { config } from '../lib/config';
import { restHandlers } from './handlers';
import { liveStockHandler } from './liveStock';

export const worker = setupWorker(...restHandlers, liveStockHandler);

export function startMockServer() {
  return worker.start({
    // The worker file lives under the deploy base (e.g. /BugBounty/ on GitHub Pages).
    serviceWorker: { url: `${config.baseUrl}mockServiceWorker.js` },
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
