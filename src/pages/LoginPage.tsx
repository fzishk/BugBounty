import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ApiError } from '../types/bazaar';

type LocationState = {
  from?: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as LocationState | null) ?? null;
  const redirectTarget = state?.from ?? '/';

  const [email, setEmail] = useState('faizan@bugbazaar.dev');
  const [password, setPassword] = useState('dev-password');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      navigate(redirectTarget, { replace: true });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(
        apiErr?.error ? apiErr : { error: { code: 'UNAUTHORIZED', message: 'Sign-in failed.' } },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      style={{
        maxWidth: '420px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #d4d4d8',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Sign In to The Bug Bazaar</h2>
      <p style={{ fontSize: '13px', color: '#52525b' }}>
        Demo account: <strong>faizan@bugbazaar.dev</strong> (any password ≥ 4 chars)
      </p>

      {error && (
        <div
          style={{
            padding: '10px',
            marginBottom: '12px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            fontSize: '14px',
          }}
        >
          <strong>{error.error.code}:</strong> {error.error.message}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                boxSizing: 'border-box',
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                boxSizing: 'border-box',
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '9px 16px',
            borderRadius: '6px',
            border: '1px solid #111827',
            backgroundColor: '#111827',
            color: '#ffffff',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </section>
  );
}
