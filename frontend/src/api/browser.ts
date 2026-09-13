import { createFocusFlowAPI } from './index';
import type { FocusFlowAPI } from './types';

let browserAPI: FocusFlowAPI | null = null;

export function getBrowserAPI() {
  browserAPI ??= createFocusFlowAPI();
  return browserAPI;
}

export function setBrowserAPIForTests(api: FocusFlowAPI | null) {
  browserAPI = api;
}