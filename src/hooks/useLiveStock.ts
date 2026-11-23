import { useCallback, useEffect, useState } from 'react';

type LiveStockOptions = {
  intervalMs?: number;
  enabled?: boolean;
};

export function useLiveStock(onTick: () => void, options: LiveStockOptions = {}) {
  const { intervalMs = 15000, enabled = true } = options;
  const [connected, setConnected] = useState<boolean>(enabled);

  useEffect(() => {
    setConnected(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!connected) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setConnected(false);
      } else if (enabled) {
        setConnected(true);
        onTick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const timer = window.setInterval(() => {
      onTick();
    }, intervalMs);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(timer);
    };
  }, [connected, enabled, intervalMs, onTick]);

  const reconnect = useCallback(() => {
    setConnected(true);
    onTick();
  }, [onTick]);

  return { connected, reconnect };
}