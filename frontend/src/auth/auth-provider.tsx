'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppAPIError, type FocusFlowAPI, type LoginInput, type Session } from '@/api';
import { getBrowserAPI } from '@/api/browser';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  error: string | null;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  api?: FocusFlowAPI;
};

export function AuthProvider({ children, api = getBrowserAPI() }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getCurrentSession()
      .then((nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setStatus('authenticated');
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof AppAPIError && cause.kind === 'unauthorized') {
          setSession(null);
          setStatus('unauthenticated');
          setError(null);
          return;
        }
        setSession(null);
        setStatus('unauthenticated');
        setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [api]);

  const login = useCallback(
    async (input: LoginInput) => {
      setError(null);
      const nextSession = await api.login(input);
      setSession(nextSession);
      setStatus('authenticated');
    },
    [api],
  );

  const logout = useCallback(async () => {
    setError(null);
    await api.logout();
    setSession(null);
    setStatus('unauthenticated');
  }, [api]);

  const refresh = useCallback(async () => {
    setError(null);
    const nextSession = await api.refreshSession();
    setSession(nextSession);
    setStatus('authenticated');
  }, [api]);

  const value = useMemo(() => ({ status, session, error, login, logout, refresh }), [status, session, error, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

function errorMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message;
  return 'The session could not be loaded.';
}