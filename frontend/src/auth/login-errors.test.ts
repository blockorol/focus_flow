import { describe, expect, it } from 'vitest';
import { AppAPIError } from '@/api';
import { loginErrorMessage } from './login-errors';

describe('login error messages', () => {
  it('uses a clear message for unauthorized login attempts', () => {
    expect(loginErrorMessage(new AppAPIError('unauthorized', 'Authentication is required.', { status: 401 }))).toBe('Check the configured username and password.');
  });

  it('keeps unexpected error messages visible', () => {
    expect(loginErrorMessage(new Error('Network unavailable'))).toBe('Network unavailable');
  });
});