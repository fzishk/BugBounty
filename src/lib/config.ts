/** Every environment variable the app reads, in one place. See README "Environment variables". */
const env = import.meta.env;

export const config = {
  /** Base URL for REST calls. The mock server answers any origin + /api/*. */
  apiBaseUrl: env.VITE_API_BASE_URL || '/api/',
  /** WebSocket URL for live stock. Intercepted by the mock server when mocks are on. */
  liveStockUrl: env.VITE_LIVE_STOCK_URL || 'wss://live.bugbazaar.mock/stock',
  /** Turn the in-browser mock backend on or off. Defaults to on. */
  enableMocks: env.VITE_ENABLE_MOCKS !== 'false',
  /** Where the app is served from ("/" locally, "/BugBounty/" on GitHub Pages). */
  baseUrl: env.BASE_URL,
} as const;
