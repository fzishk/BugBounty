import { Link } from 'react-router-dom';
import type { Product } from '../types/bazaar';
import { formatCents } from '../utils/currency';

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <article
      style={{
        border: '1px solid #d4d4d8',
        borderRadius: '8px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '10px',
        backgroundColor: '#ffffff',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#52525b',
            marginBottom: '6px',
          }}
        >
          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{product.category}</span>
          <span>★ {product.rating.toFixed(1)}</span>
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>
          <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: '#111827' }}>
            {product.name}
          </Link>
        </h3>

        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>
          {formatCents(product.price)}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '13px',
            color: outOfStock ? '#b91c1c' : '#15803d',
          }}
        >
          {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => onAddToCart(product)}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid #111827',
            backgroundColor: outOfStock ? '#e4e4e7' : '#111827',
            color: outOfStock ? '#71717a' : '#ffffff',
            cursor: outOfStock ? 'not-allowed' : 'pointer',
            fontSize: '13px',
          }}
        >
          {outOfStock ? 'Sold Out' : 'Add to Cart'}
        </button>

        <Link to={`/products/${product.id}`} style={{ fontSize: '13px' }}>
          Details
        </Link>
      </div>
    </article>
  );
}
