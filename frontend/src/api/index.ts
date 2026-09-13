import { MockFocusFlowAPI } from './mock/client';
import { RealFocusFlowAPI, createOpenAPIClient } from './real';
import type { FocusFlowAPI } from './types';

export type APIMode = 'mock' | 'real';

export function getAPIMode(value = process.env.NEXT_PUBLIC_API_MODE): APIMode {
  return value === 'mock' ? 'mock' : 'real';
}

export function createFocusFlowAPI(mode = getAPIMode()): FocusFlowAPI {
  if (mode === 'mock') return new MockFocusFlowAPI();
  return new RealFocusFlowAPI();
}

export { AppAPIError, type AppAPIErrorKind } from './errors';
export { MockFocusFlowAPI } from './mock/client';
export { RealFocusFlowAPI, createOpenAPIClient } from './real';
export { createOpenAPIClient as createAPIClient };
export type * from './types';
