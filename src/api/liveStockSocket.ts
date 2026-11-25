import type { LiveStockClientMessage, LiveStockServerMessage } from './contract';

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

type Options = {
  url: string;
  onUpdate: (updates: Array<{ productId: string; stock: number }>) => void;
  onStatus: (status: SocketStatus) => void;
  /** Override for tests. */
  backoffMs?: (attempt: number) => number;
};

/** Exponential backoff with jitter: ~0.5s, 1s, 2s, 4s ... capped at 15s. */
export const defaultBackoff = (attempt: number) =>
  Math.min(15000, 500 * 2 ** attempt) * (0.75 + Math.random() * 0.5);

/**
 * A WebSocket that reconnects on its own. Calling `close()` is final: it stops the socket,
 * cancels any pending reconnect timer, and ignores late events.
 */
export function connectLiveStock({ url, onUpdate, onStatus, backoffMs = defaultBackoff }: Options) {
  let socket: WebSocket | null = null;
  let productIds: string[] = [];
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let closedByUs = false;

  const sendSubscription = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message: LiveStockClientMessage = { type: 'subscribe', productIds };
      socket.send(JSON.stringify(message));
    }
  };

  const open = () => {
    onStatus(attempt === 0 ? 'connecting' : 'reconnecting');
    const ws = new WebSocket(url);
    socket = ws;

    ws.addEventListener('open', () => {
      attempt = 0;
      onStatus('open');
      sendSubscription(); // re-subscribe after every reconnect
    });

    ws.addEventListener('message', (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const message = JSON.parse(event.data) as LiveStockServerMessage;
        if (message.type === 'stock') onUpdate(message.updates);
      } catch {
        // Ignore malformed frames.
      }
    });

    ws.addEventListener('close', () => {
      if (closedByUs) return;
      onStatus('reconnecting');
      reconnectTimer = setTimeout(open, backoffMs(attempt));
      attempt += 1;
    });
  };

  open();

  return {
    subscribe(ids: string[]) {
      productIds = ids;
      sendSubscription();
    },
    close() {
      closedByUs = true;
      clearTimeout(reconnectTimer);
      socket?.close(1000, 'Client closed');
      socket = null;
      onStatus('closed');
    },
  };
}
