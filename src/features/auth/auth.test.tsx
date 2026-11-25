import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { revokeAllSessions } from '../../mocks/handlers';
import { server } from '../../mocks/node';
import { cartWith, inStockProduct, renderApp, signedInState } from '../../test/renderApp';

describe('login and session', () => {
  it('sends a signed-out shopper to login, then back to checkout after signing in', async () => {
    const p = inStockProduct();
    const { user } = renderApp('/checkout', cartWith(p.id, 1));

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'demo@bugbazaar.dev');
    await user.type(screen.getByLabelText('Password'), 'duck1234');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('shows friendly copy for wrong credentials, never the raw server message', async () => {
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'demo@bugbazaar.dev');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/email or password is incorrect/i);
    expect(screen.queryByText(/UNAUTHORIZED/)).not.toBeInTheDocument();
  });

  it('maps a 400 to field errors that are linked to their inputs', async () => {
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const email = await screen.findByLabelText('Email');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(email).toHaveAccessibleDescription(/valid email address/i);
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(/required/i);
    expect(email).toHaveFocus();
  });

  it('sends only one login request when the form is submitted twice quickly', async () => {
    let loginCalls = 0;
    server.events.on('request:start', ({ request }) => {
      if (request.url.endsWith('/api/login')) loginCalls += 1;
    });
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'demo@bugbazaar.dev');
    await user.type(screen.getByLabelText('Password'), 'duck1234');
    // Two submits in the same tick, before React can re-render a disabled button.
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(await screen.findByRole('heading', { name: /my account/i })).toBeInTheDocument();
    expect(loginCalls).toBe(1);
    server.events.removeAllListeners();
  });

  it('clears the session on a 401 and asks the user to sign in again', async () => {
    const state = signedInState();
    revokeAllSessions(); // the token the app holds is no longer valid on the server
    renderApp('/account', state);

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    // Shown both in the login card and as an announced toast.
    expect(screen.getAllByText(/your session expired/i).length).toBeGreaterThanOrEqual(1);
    expect(window.localStorage.getItem('bazaar:session:v1')).toBe('null');
  });
});
