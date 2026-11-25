import { describe, expect, it } from 'vitest';
import { config } from '../lib/config';
import { dropLiveConnections } from '../mocks/liveStock';
import { connectLiveStock, type SocketStatus } from './liveStockSocket';

const waitFor = async (check: () => boolean, ms = 2000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms) throw new Error('timed out');
    await new Promise((r) => setTimeout(r, 10));
  }
};

describe('live stock socket', () => {
  it('reconnects after the connection drops, and stays closed after close()', async () => {
    const statuses: SocketStatus[] = [];
    const connection = connectLiveStock({
      url: config.liveStockUrl,
      onUpdate: () => undefined,
      onStatus: (s) => statuses.push(s),
      backoffMs: () => 20,
    });
    await waitFor(() => statuses.includes('open'));

    dropLiveConnections();
    await waitFor(() => statuses.filter((s) => s === 'open').length === 2);
    expect(statuses).toContain('reconnecting');

    connection.close();
    const countAfterClose = statuses.length;
    await new Promise((r) => setTimeout(r, 100));
    expect(statuses.at(-1)).toBe('closed');
    expect(statuses.length).toBe(countAfterClose); // no reconnect attempts after close
  });
});
