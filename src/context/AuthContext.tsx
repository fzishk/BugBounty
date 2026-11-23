import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, tokenStorage } from '../api/client';
import type { LoginPayload, User } from '../types/bazaar';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(() => Boolean(tokenStorage.get()));

  useEffect(() => {
    const existingToken = tokenStorage.get();
    if (!existingToken) {
      setInitializing(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    apiClient
      .getMe(controller.signal, existingToken)
      .then((me) => {
        if (!active) return;
        setToken(existingToken);
        setUser(me);
        setInitializing(false);
      })
      .catch(() => {
        if (!active || controller.signal.aborted) return;
        tokenStorage.clear();
        setToken(null);
        setUser(null);
        setInitializing(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    const res = await apiClient.login(payload);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    apiClient.logout();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      initializing,
      login,
      logout,
    }),
    [user, token, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
