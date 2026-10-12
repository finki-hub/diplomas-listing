import type { ExecutionContext } from 'hono';

import { expect, it, vi } from 'vitest';

import worker from '../index.js';

const EMPTY_ENV = {
  CAS_PASSWORD: '',
  CAS_USERNAME: '',
  POSTHOG_HOST: '',
  POSTHOG_KEY: '',
};

it('redirects cross-origin GET with CORS and preserves encoded path/query', async () => {
  const waitUntil = vi.fn();
  const context = {
    passThroughOnException: vi.fn(),
    props: {},
    waitUntil,
  } satisfies ExecutionContext;
  const response = await worker.fetch(
    new Request(
      'https://magisterski-api.finki-hub.com/masters/download/42%2F43?keep=%2f&lang=mk',
      { headers: { Origin: 'https://theses.finki-hub.com' } },
    ),
    EMPTY_ENV,
    context,
  );

  expect(response.status).toBe(308);
  expect(response.headers.get('Location')).toBe(
    'https://masters-api.finki-hub.com/masters/download/42%2F43?keep=%2f&lang=mk',
  );
  expect(response.headers.get('access-control-allow-origin')).toBe('*');
  expect(waitUntil).not.toHaveBeenCalled();
});

it('uses a method-preserving redirect status for legacy non-GET requests', async () => {
  const response = await worker.fetch(
    new Request('https://magisterski-api.finki-hub.com/masters', {
      method: 'POST',
    }),
    EMPTY_ENV,
  );

  expect(response.status).toBe(308);
});

it.each([
  'https://masters-api.finki-hub.com/masters',
  'https://unrecognized.finki-hub.com/masters',
  'https://magisterski-api.finki-hub.com.evil.test/masters',
  'https://constructor/masters',
  'https://toString/masters',
  'http://localhost:8787/masters',
])(
  'does not redirect OPTIONS for host %s; CORS handles preflight',
  async (host) => {
    const response = await worker.fetch(
      new Request(`${host}?preflight=1`, {
        headers: {
          'Access-Control-Request-Method': 'GET',
          Origin: 'https://theses.finki-hub.com',
        },
        method: 'OPTIONS',
      }),
      EMPTY_ENV,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain(
      'GET',
    );
  },
);

it.each([
  'https://masters-api.finki-hub.com/masters',
  'https://unrecognized.finki-hub.com/masters',
  'https://magisterski-api.finki-hub.com.evil.test/masters',
  'https://constructor/masters',
  'https://toString/masters',
  'http://localhost:8787/masters',
])('passes GET through without redirect for host %s', async (host) => {
  const waitUntil = vi.fn();
  const context = {
    passThroughOnException: vi.fn(),
    props: {},
    waitUntil,
  } satisfies ExecutionContext;
  const response = await worker.fetch(
    new Request(host, {
      headers: { Origin: 'https://theses.finki-hub.com' },
    }),
    EMPTY_ENV,
    context,
  );

  expect(response.status).toBe(500);
  expect(response.headers.has('Location')).toBe(false);
  expect(response.headers.get('access-control-allow-origin')).toBe('*');
  expect(waitUntil).not.toHaveBeenCalled();
});

it('passes legacy preflight through to the CORS handler', async () => {
  const response = await worker.fetch(
    new Request('https://magisterski-api.finki-hub.com/masters', {
      headers: {
        'Access-Control-Request-Method': 'GET',
        Origin: 'https://theses.finki-hub.com',
      },
      method: 'OPTIONS',
    }),
    EMPTY_ENV,
  );

  expect(response.status).toBe(204);
  expect(response.headers.get('access-control-allow-origin')).toBe('*');
  expect(response.headers.get('access-control-allow-methods')).toContain('GET');
});
