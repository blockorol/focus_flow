import { AppAPIError } from '@/api';

export function loginErrorMessage(cause: unknown) {
  if (cause instanceof AppAPIError && cause.kind === 'unauthorized') return 'Check the configured username and password.';
  if (cause instanceof Error) return cause.message;
  return 'The sign-in request failed.';
}