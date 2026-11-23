import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient, tokenStorage } from './api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import CartPage from './pages/CartPage';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import type { Product } from './types/bazaar';

const sampleProduct: Product = {
  id: 'prod-0001',
  name: 'Clicky 65% Dev Keyboard #0001',
  price: 12650,
  category: 'keyboards',
  stock: 3,
  rating: 4.5,
  imageUrl: 'https://example.com/images/prod-0001.png',
};

const outOfStockProduct: Product = {
  id: 'prod-0025',
  name: 'Works On My Machine Sticker #0025',
  price: 14375,
  category: 'stickers',
  stock: 0,
  rating: 4.2,
  imageUrl: 'https://example.com/images/prod-0025.png',
};

function CartHarness() {
  const { items, subtotalCents, totalItems, addItem, updateQuantity, removeItem } = useCart();
  return (
    <div>
      <span data-testid="count">{totalItems}</span>
      <span data-testid="subtotal">{subtotalCents}</span>
      <span data-testid="first-qty">{items[0]?.quantity ?? 0}</span>
      <button type="button" onClick={() => addItem(sampleProduct, 2)}>
        Add Two
      </button>
      <button type="button" onClick={() => addItem(sampleProduct, 5)}>
        Add Five
      </button>
      <button type="button" onClick={() => addItem(outOfStockProduct, 1)}>
        Add OOS
      </button>
      <button type="button" onClick={() => updateQuantity(sampleProduct.id, 1)}>
        Set One
      </button>
      <button type="button" onClick={() => removeItem(sampleProduct.id)}>
        Remove First
      </button>
    </div>
  );
}

function DebounceHarness({ value }: { value: string }) {
  const debounced = useDebouncedValue(value, 50);
  return <span data-testid="debounced">{debounced}</span>;
}

function AuthStatusHarness() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? user?.email : 'guest'}</span>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe('The Bug Bazaar Behavioral Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
    tokenStorage.clear();
  });

  it('1. adds items to cart and calculates integer-cent subtotal', () => {
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText('Add Two'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('25300');
  });

  it('2. clamps cart quantity to available product stock', () => {
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText('Add Five'));
    expect(screen.getByTestId('first-qty')).toHaveTextContent('3');
  });

  it('3. ignores adding out-of-stock products', () => {
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText('Add OOS'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('4. updates item quantity in cart', () => {
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText('Add Two'));
    fireEvent.click(screen.getByText('Set One'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('12650');
  });

  it('5. removes item from cart', () => {
    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText('Add Two'));
    fireEvent.click(screen.getByText('Remove First'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('6. persists cart items across reload via localStorage', () => {
    const first = render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText('Add Two'));
    first.unmount();

    render(
      <CartProvider>
        <CartHarness />
      </CartProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('25300');
  });

  it('7. debounces rapid value updates in useDebouncedValue', async () => {
    const { rerender } = render(<DebounceHarness value="a" />);
    rerender(<DebounceHarness value="ab" />);
    rerender(<DebounceHarness value="abc" />);
    expect(screen.getByTestId('debounced')).toHaveTextContent('a');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(screen.getByTestId('debounced')).toHaveTextContent('abc');
  });

  it('8. signs in user and clears session on logout', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthStatusHarness />
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Sign In'));
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('faizan@bugbazaar.dev');
    });
    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('auth-state')).toHaveTextContent('guest');
  });

  it('9. rejects invalid login credentials with error message', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>,
    );
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '12' } });
    fireEvent.click(screen.getByText('Sign In'));
    expect(await screen.findByText(/UNAUTHORIZED/i)).toBeInTheDocument();
  });

  it('10. redirects unauthenticated user from checkout to login', async () => {
    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={['/checkout']}>
            <Routes>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>,
    );
    expect(await screen.findByText(/Sign In to The Bug Bazaar/i)).toBeInTheDocument();
  });

  it('8. signs in user and clears session on logout', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthStatusHarness />
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Sign In'));
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('faizan@bugbazaar.dev');
    });
    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('auth-state')).toHaveTextContent('guest');
  });

  it('12. filters catalog items by search query', async () => {
    render(
      <CartProvider>
        <MemoryRouter>
          <CatalogPage />
        </MemoryRouter>
      </CartProvider>,
    );
    fireEvent.change(screen.getByLabelText(/search products/i), {
      target: { value: 'prod-0001' },
    });
    expect(await screen.findByText(/Clicky 65% Dev Keyboard #0001/i)).toBeInTheDocument();
  });

  it('13. shows empty state when search matches no items', async () => {
    render(
      <CartProvider>
        <MemoryRouter>
          <CatalogPage />
        </MemoryRouter>
      </CartProvider>,
    );
    fireEvent.change(screen.getByLabelText(/search products/i), {
      target: { value: 'nonexistent-xyz-999' },
    });
    expect(await screen.findByText(/No products matched your current filters/i)).toBeInTheDocument();
  });

  it('14. places an order and navigates to order confirmation', async () => {
    await apiClient.login({ email: 'faizan@bugbazaar.dev', password: 'dev-password' });
    window.localStorage.setItem(
      'bug_bazaar_cart_v1',
      JSON.stringify([{ ...sampleProduct, productId: sampleProduct.id, quantity: 1 }]),
    );


    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={['/checkout']}>
            <Routes>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders/:id" element={<OrderConfirmationPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>,
    );

    const placeBtn = await screen.findByText('Place Order');
    fireEvent.click(placeBtn);
    expect(await screen.findByText(/Order Confirmed/i)).toBeInTheDocument();
  });

  it('15. reports out-of-stock item on 409 checkout conflict', async () => {
    await apiClient.login({ email: 'faizan@bugbazaar.dev', password: 'dev-password' });
    window.localStorage.setItem(
      'bug_bazaar_cart_v1',
      JSON.stringify([{ ...sampleProduct, productId: sampleProduct.id, quantity: 999 }]),
    );

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={['/checkout']}>
            <Routes>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>,
    );

    const placeBtn = await screen.findByText('Place Order');
    fireEvent.click(placeBtn);
    expect(await screen.findByText(/OUT_OF_STOCK/i)).toBeInTheDocument();
    const mentions = screen.getAllByText(/Clicky 65% Dev Keyboard #0001/i);
    expect(mentions.length).toBeGreaterThan(0);
  });
});