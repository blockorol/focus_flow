import { createFocusFlowAPI, createOpenAPIClient } from './index';

export const createAPIClient = createOpenAPIClient;

export async function getHealth(client = createFocusFlowAPI()) {
  return client.getHealth();
}
