import { useEffect, useRef } from 'react';
import { connectLiveStock } from '../../api/liveStockSocket';
import { useAppDispatch } from '../../app/hooks';
import { config } from '../../lib/config';
import { connectionChanged, stockUpdated } from './liveStockSlice';

/**
 * Subscribes to live stock for `productIds` while the calling page is mounted.
 * One socket per page; it reconnects on drops and is closed when the page unmounts or the tab closes.
 */
export function useLiveStock(productIds: string[]): void {
  const dispatch = useAppDispatch();
  const connectionRef = useRef<ReturnType<typeof connectLiveStock> | null>(null);
  const idsKey = productIds.join(',');

  useEffect(() => {
    const connection = connectLiveStock({
      url: config.liveStockUrl,
      onUpdate: (updates) => dispatch(stockUpdated(updates)),
      onStatus: (status) => dispatch(connectionChanged(status)),
    });
    connectionRef.current = connection;
    // 'pagehide' fires when the tab closes or navigates away (more reliable than 'unload').
    const onPageHide = () => connection.close();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      connection.close();
      connectionRef.current = null;
    };
  }, [dispatch]);

  useEffect(() => {
    connectionRef.current?.subscribe(idsKey ? idsKey.split(',') : []);
  }, [idsKey]);
}
