export type AppAPIErrorKind = 'unauthorized' | 'not_found' | 'conflict' | 'unexpected';

type APIErrorBody = {
  message: string;
  requestId?: string | null;
};

export class AppAPIError extends Error {
  readonly kind: AppAPIErrorKind;
  readonly status?: number;
  readonly requestId?: string | null;

  constructor(kind: AppAPIErrorKind, message: string, options: { status?: number; requestId?: string | null; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppAPIError';
    this.kind = kind;
    this.status = options.status;
    this.requestId = options.requestId;
  }
}

export function apiErrorFromResponse(status: number, error: unknown): AppAPIError {
  const body = isErrorResponse(error) ? error : undefined;
  const message = body?.message ?? fallbackMessage(status);
  const requestId = body?.requestId;
  switch (status) {
    case 401:
      return new AppAPIError('unauthorized', message, { status, requestId });
    case 404:
      return new AppAPIError('not_found', message, { status, requestId });
    case 409:
      return new AppAPIError('conflict', message, { status, requestId });
    default:
      return new AppAPIError('unexpected', message, { status, requestId });
  }
}

export function assertData<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (!result.response.ok || result.data === undefined) {
    throw apiErrorFromResponse(result.response.status, result.error);
  }
  return result.data;
}

function isErrorResponse(value: unknown): value is APIErrorBody {
  return typeof value === 'object' && value !== null && typeof (value as APIErrorBody).message === 'string';
}

function fallbackMessage(status: number) {
  switch (status) {
    case 401:
      return 'Authentication is required.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'The requested change conflicts with the current resource state.';
    default:
      return 'The API request failed.';
  }
}
