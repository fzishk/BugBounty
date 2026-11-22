import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { ApiError } from '../types/bazaar';
import { formatCents } from '../utils/currency';

export default function CheckoutPage() {
  const { isAuthenticated, initializing, user } = useAuth();
  const { items, subtotalCents, clearCart } = useCart();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const idempotencyKeyRef = useRef<string>(
    `ord-idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: '/checkout' } });
    }
  }, [initializing, isAuthenticated, navigate]);

  if (initializing || !isAuthenticated) {
    return <p>Checking session...</p>;
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: '20px', border: '1px solid #e4e4e7', borderRadius: '8px' }}>
        <h2>Nothing to Checkout</h2>
        <p>Your cart is currently empty.</p>
        <Link to="/">Back to Catalog</Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const order = await apiClient.createOrder({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        idempotencyKey: idempotencyKeyRef.current,
      });

      clearCart();
      navigate(`/orders/${order.id}`, { state: { order } });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(
        apiErr?.error
          ? apiErr
          : { error: { code: 'INTERNAL_ERROR', message: 'Could not complete order.' } },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const outOfStockProductName = error?.error.details?.productName;

  return (
    <section
      style={{
        border: '1px solid #d4d4d8',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#ffffff',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Checkout</h2>
      <p style={{ fontSize: '14px', color: '#52525b' }}>
        Ordering as <strong>{user?.name}</strong> ({user?.email})
      </p>

      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
          }}
        >
          <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
            {error.error.code}: {error.error.message}
          </p>
          {outOfStockProductName && (
            <p style={{ margin: 0, fontSize: '13px' }}>
              Affected item: <strong>{outOfStockProductName}</strong>. Adjust quantity in{' '}
              <Link to="/cart">Cart</Link> and try again.
            </p>
          )}
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
        {items.map((item) => (
          <li
            key={item.productId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #f4f4f5',
              fontSize: '14px',
            }}
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <strong>{formatCents(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          fontSize: '18px',
          fontWeight: 700,
        }}
      >
        <span>Total</span>
        <span>{formatCents(subtotalCents)}</span>
      </div>

      <form onSubmit={(e) => void handlePlaceOrder(e)} style={{ display: 'flex', gap: '10px' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 18px',
            borderRadius: '6px',
            border: '1px solid #111827',
            backgroundColor: '#111827',
            color: '#ffffff',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Placing Order...' : 'Place Order'}
        </button>
        <Link to="/cart" style={{ alignSelf: 'center', fontSize: '14px' }}>
          ← Back to Cart
        </Link>
      </form>
    </section>
  );
}
