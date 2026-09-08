import createClient from 'openapi-fetch';
import type { paths } from './generated/schema';

export function createAPIClient(
  baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
) {
  return createClient<paths>({ baseUrl, credentials: 'include', fetch: fetchImplementation });
}

export async function getHealth(client = createAPIClient()) {
  const result = await client.GET('/v1/health');
  if (!result.response.ok || !result.data) throw new Error('The API is unavailable.');
  return result.data;
}
