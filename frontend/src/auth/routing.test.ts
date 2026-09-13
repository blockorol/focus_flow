import { describe, expect, it } from 'vitest';
import { redirectAfterLogin, redirectForProtectedRoute } from './routing';

describe('auth routing helpers', () => {
  it('redirects unauthenticated users away from protected routes', () => {
    expect(redirectForProtectedRoute('unauthenticated', '/')).toBe('/login');
    expect(redirectForProtectedRoute('unauthenticated', '/focuses/123')).toBe('/login');
  });

  it('does not redirect while loading, authenticated, or already on login', () => {
    expect(redirectForProtectedRoute('loading', '/')).toBeNull();
    expect(redirectForProtectedRoute('authenticated', '/')).toBeNull();
    expect(redirectForProtectedRoute('unauthenticated', '/login')).toBeNull();
  });

  it('redirects authenticated users away from login', () => {
    expect(redirectAfterLogin('authenticated', true)).toBe('/');
    expect(redirectAfterLogin('authenticated', false)).toBeNull();
    expect(redirectAfterLogin('unauthenticated', false)).toBeNull();
  });
});