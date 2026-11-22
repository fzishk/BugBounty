import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { ApiError, Order } from '../types/bazaar';
import { formatCents } from '../utils/currency';

type OrderRouteState = {
  order?: Order;
};

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = (location.state as OrderRouteState | null) ?? null;

  const [order, setOrder] = useState<Order | null>(state?.order ?? null);
  const [loading, setLoading] = useState<boolean>(!state?.order);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (order) return;
    if (!id) {
      setError({ error: { code: 'BAD_REQUEST', message: 'Missing order ID.' } });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    apiClient
      .getOrderById(id, controller.signal)
      .then((fetched) => {
        if (!active) return;
        setOrder(fetched);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        const apiErr = err as ApiError;
        setError(
          apiErr?.error
            ? apiErr
            : { error: { code: 'NOT_FOUND', message: 'Order could not be loaded.' } },
        );
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, order]);

  if (loading) {
    return <p>Loading order receipt...</p>;
  }

  if (error || !order) {
    return (
      <div style={{ padding: '18px', border: '1px solid #fca5a5', borderRadius: '8px' }}>
        <h2>Order Not Found</h2>
        <p>{error?.error.message ?? 'Unable to find that order.'}</p>
        <Link to="/">Return to Catalog</Link>
      </div>
    );
  }

  return (
    <section
      style={{
        border: '1px solid #bbf7d0',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h2 style={{ marginTop: 0, color: '#166534' }}>Order Confirmed</h2>
      <p style={{ margin: '4px 0', fontSize: '14px' }}>
        Order ID: <strong>{order.id}</strong> • Status: <strong>{order.status}</strong>
      </p>
      <p style={{ margin: '4px 0 14px', fontSize: '13px', color: '#3f3f46' }}>
        Placed at: {new Date(order.createdAt).toLocaleString()}
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px' }}>
        {order.items.map((item) => (
          <li
            key={item.productId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid #dcfce7',
              fontSize: '14px',
            }}
          >
            <span>
              {item.name} × {item.quantity} ({formatCents(item.unitPrice)} each)
            </span>
            <strong>{formatCents(item.unitPrice * item.quantity)}</strong>
          </li>
        ))}
      </ul>

      <p style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>
        Total Paid: {formatCents(order.total)}
      </p>

      <Link to="/">Continue Shopping</Link>
    </section>
  );
}
