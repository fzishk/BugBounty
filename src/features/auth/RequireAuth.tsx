import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { selectIsSignedIn } from './sessionSlice';

export type ReturnTo = { from?: { pathname: string; search: string } };

/** Route guard: sends signed-out users to /login and remembers where they were going. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const signedIn = useAppSelector(selectIsSignedIn);
  const location = useLocation();
  if (!signedIn) {
    const state: ReturnTo = { from: { pathname: location.pathname, search: location.search } };
    return <Navigate to="/login" replace state={state} />;
  }
  return <>{children}</>;
}
