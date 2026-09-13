import { describe, expect, it, vi } from 'vitest';
import { AppAPIError, RealFocusFlowAPI, createAPIClient, createFocusFlowAPI, getAPIMode } from './index';

describe('API transport', () => {
  it('uses the configured origin and includes browser credentials', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: 'ok' }));
    const client = createAPIClient('https://api.example.test', fetcher);
    const result = await client.GET('/v1/health');
    const request = fetcher.mock.calls[0]?.[0] as Request;
    expect(request.url).toBe('https://api.example.test/v1/health');
    expect(request.credentials).toBe('include');
    expect(result.data?.status).toBe('ok');
  });

  it('normalizes unsuccessful HTTP responses in the real app boundary', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 'unauthorized', message: 'Authentication is required.' }, { status: 401 }));
    const api = new RealFocusFlowAPI(createAPIClient('https://api.example.test', fetcher));
    await expect(api.getCurrentSession()).rejects.toMatchObject({ kind: 'unauthorized', status: 401 });
  });

  it('propagates network failure through the real app boundary', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Network unavailable'));
    const api = new RealFocusFlowAPI(createAPIClient('https://api.example.test', fetcher));
    await expect(api.getHealth()).rejects.toThrow('Network unavailable');
  });
});

describe('API mode selection', () => {
  it('uses real mode by default', () => {
    expect(getAPIMode(undefined)).toBe('real');
  });

  it('creates mock API when mock mode is selected', async () => {
    const api = createFocusFlowAPI('mock');
    await expect(api.getCurrentSession()).rejects.toBeInstanceOf(AppAPIError);
    const session = await api.login({ username: 'local', password: 'anything' });
    expect(session.user.username).toBe('local');
  });
});
