import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../app/App';
import { makeStore, type RootState } from '../app/store';
import type { Product } from '../api/contract';
import { db, DEMO_USER } from '../mocks/db';

/** Renders the whole app (real store, real router, mock API) at `route`. */
export function renderApp(route = '/', preloadedState: Partial<RootState> = {}) {
  const store = makeStore(preloadedState);
  const user = userEvent.setup();
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </Provider>,
  );
  return { store, user, ...utils };
}

export function product(id: string): Product {
  const found = db.productsById.get(id);
  if (!found) throw new Error(`No product ${id}`);
  return found;
}

/** A signed-in session whose token the mock server accepts. */
export function signedInState(): Pick<RootState, 'session'> {
  const token = 'tok_test';
  db.tokens.set(token, DEMO_USER.id);
  return { session: { status: 'signed-in', token, user: DEMO_USER } };
}

export function cartWith(id: string, quantity: number): Pick<RootState, 'cart'> {
  const p = product(id);
  return {
    cart: {
      lines: [
        {
          productId: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          category: p.category,
          stock: p.stock,
          quantity,
        },
      ],
    },
  };
}

/** First seeded product with at least `min` units, so tests don't depend on seed details. */
export function inStockProduct(min = 3, category?: Product['category']): Product {
  const found = db.products.find((p) => p.stock >= min && (!category || p.category === category));
  if (!found) throw new Error('No product with enough stock');
  return found;
}
