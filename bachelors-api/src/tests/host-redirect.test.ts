import type { ExecutionContext } from 'hono';

import { describe, expect, it, vi } from 'vitest';

import worker from '../index.js';

const EMPTY_ENV = {
  CAS_PASSWORD: '',
  CAS_USERNAME: '',
  POSTHOG_HOST: '',
  POSTHOG_KEY: '',
};

const createContext = () => {
  const waitUntil = vi.fn();
  const context = {
    passThroughOnException: vi.fn(),
    props: {},
    waitUntil,
  } satisfies ExecutionContext;

  return { context, waitUntil };
};

const fetchWorker = (request: Request) => {
  const { context, waitUntil } = createContext();
  return {
    response: worker.fetch(request, EMPTY_ENV, context),
    waitUntil,
  };
};

describe('bachelors API host redirects', () => {
  it.each([
    'https://diplomas-api.finki-hub.com',
    'https://diplomski-api.finki-hub.com',
  ])(
    'redirects cross-origin GET from %s with CORS and preserves encoded path/query',
    async (host) => {
      const { response: pendingResponse, waitUntil } = fetchWorker(
        new Request(
          `${host}/diplomas/download/a%2Fb/%E2%9C%93?keep=x%2Fy&plus=a+b`,
          { headers: { Origin: 'https://theses.finki-hub.com' } },
        ),
      );
      const response = await pendingResponse;

      expect(response.status).toBe(308);
      expect(response.headers.get('Location')).toBe(
        'https://bachelors-api.finki-hub.com/diplomas/download/a%2Fb/%E2%9C%93?keep=x%2Fy&plus=a+b',
      );
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(waitUntil).not.toHaveBeenCalled();
    },
  );

  it('uses a method-preserving redirect status for legacy non-GET requests', async () => {
    const { response } = fetchWorker(
      new Request('https://diplomas-api.finki-hub.com/diplomas', {
        method: 'POST',
      }),
    );

    const redirect = await response;
    expect(redirect.status).toBe(308);
  });

  it.each([
    'https://bachelors-api.finki-hub.com/diplomas',
    'https://unrecognized.finki-hub.com/diplomas',
    'https://diplomas-api.finki-hub.com.evil.test/diplomas',
    'https://constructor/diplomas',
    'https://toString/diplomas',
    'http://localhost:8787/diplomas',
  ])(
    'does not redirect OPTIONS for host %s; CORS handles preflight',
    async (host) => {
      const { response } = fetchWorker(
        new Request(`${host}?preflight=1`, {
          headers: {
            'Access-Control-Request-Method': 'GET',
            Origin: 'https://theses.finki-hub.com',
          },
          method: 'OPTIONS',
        }),
      );

      const corsResponse = await response;
      expect(corsResponse.status).toBe(204);
      expect(corsResponse.headers.get('access-control-allow-origin')).toBe('*');
      expect(
        corsResponse.headers.get('access-control-allow-methods'),
      ).toContain('GET');
    },
  );

  it.each([
    'https://bachelors-api.finki-hub.com/diplomas',
    'https://unrecognized.finki-hub.com/diplomas',
    'https://diplomas-api.finki-hub.com.evil.test/diplomas',
    'https://constructor/diplomas',
    'https://toString/diplomas',
    'http://localhost:8787/diplomas',
  ])('passes GET through without redirect for host %s', async (host) => {
    const { response: pendingResponse, waitUntil } = fetchWorker(
      new Request(host, {
        headers: { Origin: 'https://theses.finki-hub.com' },
      }),
    );
    const response = await pendingResponse;

    expect(response.status).toBe(500);
    expect(response.headers.has('Location')).toBe(false);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('passes legacy preflight through to the CORS handler', async () => {
    const { response: pendingResponse } = fetchWorker(
      new Request('https://diplomas-api.finki-hub.com/diplomas', {
        headers: {
          'Access-Control-Request-Method': 'GET',
          Origin: 'https://theses.finki-hub.com',
        },
        method: 'OPTIONS',
      }),
    );
    const response = await pendingResponse;

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain(
      'GET',
    );
  });
});
