type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function redirectForProtectedRoute(status: AuthStatus, pathname: string) {
  if (status === 'unauthenticated' && pathname !== '/login') return '/login';
  return null;
}

export function redirectAfterLogin(status: AuthStatus, hasSession: boolean) {
  if (status === 'authenticated' && hasSession) return '/';
  return null;
}