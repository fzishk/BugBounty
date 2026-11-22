import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useCart } from '../context/CartContext';
import type { ApiError, Product } from '../types/bazaar';
import { formatCents } from '../utils/currency';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [addedNotice, setAddedNotice] = useState('');

  useEffect(() => {
    if (!id) {
      setError({ error: { code: 'BAD_REQUEST', message: 'Missing product ID.' } });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);
    setAddedNotice('');

    apiClient
      .getProductById(id, controller.signal)
      .then((item) => {
        if (!active) return;
        setProduct(item);
        setQuantity(item.stock > 0 ? 1 : 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        const apiErr = err as ApiError;
        setError(
          apiErr?.error
            ? apiErr
            : { error: { code: 'INTERNAL_ERROR', message: 'Failed to load product.' } },
        );
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  const handleQtyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseInt(e.target.value, 10);
    if (Number.isNaN(val)) {
      setQuantity(1);
      return;
    }
    const maxStock = product ? Math.max(1, product.stock) : 1;
    setQuantity(Math.min(maxStock, Math.max(1, val)));
  };

  if (loading) {
    return <p>Loading product details...</p>;
  }

  if (error || !product) {
    return (
      <div style={{ padding: '16px', border: '1px solid #fca5a5', borderRadius: '8px' }}>
        <h2>Product Unavailable</h2>
        <p>{error?.error.message ?? 'The requested product was not found.'}</p>
        <Link to="/">← Back to Catalog</Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <section
      style={{
        border: '1px solid #d4d4d8',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#ffffff',
      }}
    >
      <Link to="/" style={{ fontSize: '14px' }}>
        ← Back to Catalog
      </Link>

      <div style={{ marginTop: '14px' }}>
        <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#52525b' }}>
          {product.category} • ID: {product.id}
        </span>
        <h2 style={{ margin: '6px 0' }}>{product.name}</h2>
        <p style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>
          {formatCents(product.price)}
        </p>
        <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#3f3f46' }}>
          Rating: ★ {product.rating.toFixed(1)} •{' '}
          <strong style={{ color: outOfStock ? '#b91c1c' : '#15803d' }}>
            {outOfStock ? 'Out of stock' : `${product.stock} available`}
          </strong>
        </p>

        {!outOfStock && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px' }}>
              Quantity:{' '}
              <input
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={handleQtyChange}
                style={{ width: '72px', padding: '6px' }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                addItem(product, quantity);
                setAddedNotice(`Added ${quantity} × ${product.name} to cart.`);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #111827',
                backgroundColor: '#111827',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Add to Cart
            </button>
          </div>
        )}

        {addedNotice && (
          <p style={{ marginTop: '12px', color: '#15803d', fontSize: '14px' }}>
            {addedNotice} <Link to="/cart">View Cart</Link>
          </p>
        )}
      </div>
    </section>
  );
}
