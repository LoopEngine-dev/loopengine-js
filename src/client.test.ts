import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoopEngine } from './client.js';

describe('LoopEngine', () => {
  const config = {
    projectKey: 'pk_test',
    projectSecret: 'psk_test',
    projectId: 'proj_test',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('send() POSTs to feedback URL with correct headers and body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: () => Promise.resolve(JSON.stringify({ id: 'fb_1', analysis_status: 'pending' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    const client = new LoopEngine(config);
    const result = await client.send({ message: 'test message' });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(201);
    expect(result.body).toEqual({ id: 'fb_1', analysis_status: 'pending' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.loopengine.dev/feedback');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-Project-Key']).toBe('pk_test');
    expect(options.headers['X-Timestamp']).toBeDefined();
    expect(options.headers['X-Signature']).toMatch(/^v1=[A-Za-z0-9_-]+$/);

    const body = JSON.parse(options.body);
    expect(body.project_id).toBe('proj_test');
    expect(body.message).toBe('test message');
  });

  it('send() sets ok false and parses body on non-2xx', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ error: 'Bad request' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    const client = new LoopEngine(config);
    const result = await client.send({ message: 'x' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: 'Bad request' });
  });
});
