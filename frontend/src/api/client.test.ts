import { describe, expect, it, vi } from 'vitest';
import { createAPIClient, getHealth } from './client';

describe('API transport', () => {
  it('uses the configured origin and includes browser credentials', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: 'ok' }));
    const result = await getHealth(createAPIClient('https://api.example.test', fetcher));
    const request = fetcher.mock.calls[0]?.[0] as Request;
    expect(request.url).toBe('https://api.example.test/v1/health');
    expect(request.credentials).toBe('include');
    expect(result.status).toBe('ok');
  });

  it('reports unsuccessful HTTP responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('Unavailable', { status: 503 }));
    await expect(getHealth(createAPIClient('https://api.example.test', fetcher))).rejects.toThrow('The API is unavailable.');
  });

  it('propagates network failure', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Network unavailable'));
    await expect(getHealth(createAPIClient('https://api.example.test', fetcher))).rejects.toThrow('Network unavailable');
  });
});
