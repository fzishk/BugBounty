import { ws } from 'msw';
import type { LiveStockClientMessage, LiveStockServerMessage } from '../api/contract';
import { config } from '../lib/config';
import { db, setStock } from './db';

const liveStock = ws.link(config.liveStockUrl);

type Client = { close: (code?: number, reason?: string) => void };
const openClients = new Set<Client>();

/** Dev tools: drop every live connection so the client's reconnect logic can be seen working. */
export function dropLiveConnections(): void {
  openClients.forEach((client) => client.close(4000, 'Simulated network drop'));
}

export const TICK_MS = 2500;

export const liveStockHandler = liveStock.addEventListener('connection', ({ client }) => {
  openClients.add(client);
  let subscribed: string[] = [];

  const send = (message: LiveStockServerMessage) => client.send(JSON.stringify(message));
  send({ type: 'hello', serverTime: new Date().toISOString() });

  client.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') return;
    try {
      const message = JSON.parse(event.data) as LiveStockClientMessage;
      if (message.type === 'subscribe') subscribed = message.productIds.slice(0, 200);
    } catch {
      // Ignore malformed frames, like a real server would.
    }
  });

  // Every tick, a couple of subscribed products sell or get restocked.
  const timer = setInterval(() => {
    if (subscribed.length === 0) return;
    const updates: Array<{ productId: string; stock: number }> = [];
    const changes = Math.min(subscribed.length, 1 + Math.floor(Math.random() * 2));
    for (let i = 0; i < changes; i += 1) {
      const productId = subscribed[Math.floor(Math.random() * subscribed.length)];
      const product = productId ? db.productsById.get(productId) : undefined;
      if (!productId || !product) continue;
      const delta =
        Math.random() < 0.7
          ? -(1 + Math.floor(Math.random() * 2))
          : 2 + Math.floor(Math.random() * 4);
      const updated = setStock(productId, product.stock + delta);
      if (updated) updates.push({ productId, stock: updated.stock });
    }
    if (updates.length > 0) send({ type: 'stock', updates });
  }, TICK_MS);

  client.addEventListener('close', () => {
    clearInterval(timer);
    openClients.delete(client);
  });
});
