import { Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import CartPage from './pages/CartPage';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import { formatCents } from './utils/currency';
import ProductDetailPage from './pages/ProductDetailPage';
import AccountPage from './pages/AccountPage';

function StoreShell() {
  const { totalItems, subtotalCents } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '14px',
          marginBottom: '20px',
          borderBottom: '1px solid #e4e4e7',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: '#111827' }}>
          <h1 style={{ margin: 0, fontSize: '22px' }}>The Bug Bazaar</h1>
        </Link>

        <nav style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '14px' }}>
          <Link to="/">Catalog</Link>
          <Link to="/cart">
            Cart ({totalItems}) • {formatCents(subtotalCents)}
          </Link>
          <Link to="/checkout">Checkout</Link>
          {isAuthenticated ? (
            <>
              <span style={{ color: '#52525b' }}>{user?.name}</span>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Sign In</Link>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:id" element={<OrderConfirmationPage />} />
          <Route path="*" element={<CatalogPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StoreShell />
      </CartProvider>
    </AuthProvider>
  );
}
