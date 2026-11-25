import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoadingState } from '../components/feedback/StateViews';
import { Layout } from '../components/layout/Layout';
import { RequireAuth } from '../features/auth/RequireAuth';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';

// Route-level code splitting: each page's code downloads only when it is first visited.
const CatalogPage = lazy(() => import('../features/catalog/CatalogPage'));
const ProductDetailPage = lazy(() => import('../features/product/ProductDetailPage'));
const CartPage = lazy(() => import('../features/cart/CartPage'));
const CheckoutPage = lazy(() => import('../features/checkout/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('../features/checkout/OrderConfirmationPage'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const AccountPage = lazy(() => import('../features/auth/AccountPage'));
const CrashPage = lazy(() => import('../pages/CrashPage'));

function PageFallback() {
  return (
    <div className="container-page py-10">
      <LoadingState />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<CatalogPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route
            path="checkout"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="orders/:id"
            element={
              <RequireAuth>
                <OrderConfirmationPage />
              </RequireAuth>
            }
          />
          <Route
            path="account"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route path="debug/crash" element={<CrashPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
