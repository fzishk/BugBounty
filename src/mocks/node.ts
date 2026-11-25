import { setupServer } from 'msw/node';
import { restHandlers } from './handlers';
import { liveStockHandler } from './liveStock';

/** Same handlers as the browser, used by Vitest. */
export const server = setupServer(...restHandlers, liveStockHandler);
