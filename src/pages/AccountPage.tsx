import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ApiError, User } from '../types/bazaar';

export default function AccountPage() {
  const { isAuthenticated, initializing, user: contextUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(contextUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: '/account' } });
    }
  }, [initializing, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    let active = true;
    setLoading(true);

    apiClient
      .getMe(controller.signal)
      .then((me) => {
        if (!active) return;
        setProfile(me);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        const apiErr = err as ApiError;
        if (apiErr?.error?.code === 'UNAUTHORIZED') {
          logout();
          navigate('/login', { replace: true, state: { from: '/account' } });
          return;
        }
        setError(apiErr);
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [isAuthenticated, logout, navigate]);

  if (initializing || !isAuthenticated) {
    return <p>Checking account session...</p>;
  }

  return (
    <section
      style={{
        border: '1px solid #d4d4d8',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#ffffff',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Account</h2>
      {loading && <p>Loading profile...</p>}
      {error && (
        <p role="alert" style={{ color: '#991b1b' }}>
          {error.error.message}
        </p>
      )}
      {profile && (
        <div>
          <p>
            <strong>Name:</strong> {profile.name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>ID:</strong> {profile.id}
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
            <Link to="/checkout">Go to Checkout</Link>
            <button type="button" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
