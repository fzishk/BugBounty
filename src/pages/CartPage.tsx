import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCents } from '../utils/currency';

export default function CartPage() {
  const { items, subtotalCents, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          border: '1px solid #e4e4e7',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <h2>Your Cart is Empty</h2>
        <p>Browse keyboards, debugging ducks, coffee, or stickers to get started.</p>
        <Link to="/">Browse Catalog</Link>
      </div>
    );
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <h2 style={{ margin: 0 }}>Shopping Cart</h2>
        <button type="button" onClick={clearCart}>
          Clear Cart
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item) => (
          <div
            key={item.productId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              border: '1px solid #d4d4d8',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
            }}
          >
            <div>
              <Link to={`/products/${item.productId}`} style={{ fontWeight: 600 }}>
                {item.name}
              </Link>
              <div style={{ fontSize: '13px', color: '#52525b' }}>
                Unit: {formatCents(item.price)} • Line: {formatCents(item.price * item.quantity)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                aria-label={`Decrease quantity for ${item.name}`}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                disabled={item.quantity >= item.stock}
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                aria-label={`Increase quantity for ${item.name}`}
              >
                +
              </button>
              <button type="button" onClick={() => removeItem(item.productId)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          border: '1px solid #d4d4d8',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', color: '#52525b' }}>Subtotal</div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatCents(subtotalCents)}</div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/checkout')}
          style={{
            padding: '10px 18px',
            borderRadius: '6px',
            border: '1px solid #111827',
            backgroundColor: '#111827',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Proceed to Checkout →
        </button>
      </div>
    </section>
  );
}
