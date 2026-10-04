/* eslint-disable camelcase -- Assert the PostHog protocol. */
import { createCatalogApp } from 'diplomas-listing-shared/src/catalog-app.js';
import { sanitizeProperties } from 'diplomas-listing-shared/src/telemetry.js';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('diplomas-listing-shared/src/build-revision.generated.js', () => ({
  BUILD_REVISION: 'a'.repeat(40),
}));

const PRIVATE = 'Private Student Thesis Advisor 123456';
const ENV = {
  CAS_PASSWORD: 'fake',
  CAS_USERNAME: 'fake',
  POSTHOG_HOST: 'https://telemetry.invalid',
  POSTHOG_KEY: 'fake',
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each(['diplomas', 'masters'])(
  'minimizes %s request bodies and owned error logs without changing responses',
  async (service) => {
    const requests: string[] = [];
    const tasks: Array<Promise<unknown>> = [];
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', (_url: unknown, options: { body: string }) => {
      requests.push(options.body);
      return Promise.resolve(Response.json({ status: 1 }));
    });
    vi.stubGlobal('caches', {
      default: {
        match: () => Promise.resolve(undefined),
        put: () => Promise.resolve(),
      },
    });
    const app = createCatalogApp({
      analytics: {
        distinctId: `${service}-api-worker`,
        service: `${service}-api`,
      },
      cacheKey: `https://example.test/${service}`,
      corsExposeHeaders: [],
      download: {
        fallbackFilename: () => 'file.pdf',
        fetchFile: () => {
          throw new Error(PRIVATE, { cause: { cookie: PRIVATE } });
        },
        path: `/${service}/download/:id`,
      },
      emptyError: 'No items',
      fetchItems: () => Promise.resolve([{ student: PRIVATE, title: PRIVATE }]),
      listPath: `/${service}`,
      staleTtlSeconds: 60,
      timeoutMs: 50,
      ttlSeconds: 60,
    });
    const ctx = {
      passThroughOnException: () => {},
      props: {},
      waitUntil: (task: Promise<unknown>) => {
        tasks.push(task);
      },
    };
    const list = await app.request(
      `https://example.test/${service}?q=${encodeURIComponent(PRIVATE)}`,
      {
        headers: { authorization: PRIVATE, 'x-build-revision': 'b'.repeat(40) },
      },
      ENV,
      ctx,
    );
    expect(await list.json()).toEqual([{ student: PRIVATE, title: PRIVATE }]);
    const download = await app.request(
      `https://example.test/${service}/download/123456?q=${encodeURIComponent(PRIVATE)}`,
      undefined,
      ENV,
      ctx,
    );
    expect(download.status).toBe(500);
    const missing = await app.request(
      `https://example.test/${encodeURIComponent(PRIVATE)}`,
      undefined,
      ENV,
      ctx,
    );
    expect(missing.status).toBe(404);
    await Promise.all(tasks);
    const output = requests.join('') + JSON.stringify(errors.mock.calls);
    expect(output).not.toContain(PRIVATE);
    expect(output).not.toContain(encodeURIComponent(PRIVATE));
    expect(output).not.toContain('123456');
    expect(output).not.toContain('b'.repeat(40));
    expect(output).toContain('a'.repeat(40));
    const events = requests.map(
      (body) =>
        JSON.parse(body) as { event: string; properties: { route: string } },
    );
    expect(events.map((event) => event.properties.route)).toContain(
      `/${service}/download/:id`,
    );
    expect(events.map((event) => event.properties.route)).toContain(
      'unmatched',
    );
    expect(
      events.filter((event) => event.event === 'request_failed'),
    ).toHaveLength(1);
    expect(errors).toHaveBeenCalledOnce();
    const beforeMissingKey = requests.length;
    const withoutAnalytics = await app.request(
      `https://example.test/${service}`,
      undefined,
      { ...ENV, POSTHOG_KEY: '' },
      ctx,
    );
    await Promise.all(tasks);
    expect(withoutAnalytics.status).toBe(200);
    expect(requests).toHaveLength(beforeMissingKey);
  },
);

it.each(['diplomas', 'masters'])(
  'captures one failure for a rejected private string in %s',
  async (service) => {
    const requests: string[] = [];
    const tasks: Array<Promise<unknown>> = [];
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', (_url: unknown, options: { body: string }) => {
      requests.push(options.body);
      return Promise.resolve(Response.json({ status: 1 }));
    });
    const app = createCatalogApp({
      analytics: {
        distinctId: `${service}-api-worker`,
        service: `${service}-api`,
      },
      cacheKey: `https://example.test/${service}`,
      corsExposeHeaders: [],
      download: {
        fallbackFilename: () => 'file.pdf',
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- Reproduce a dependency rejecting a private non-Error value.
        fetchFile: () => Promise.reject(PRIVATE),
        path: `/${service}/download/:id`,
      },
      emptyError: 'No items',
      fetchItems: () => Promise.resolve([]),
      listPath: `/${service}`,
      staleTtlSeconds: 60,
      timeoutMs: 50,
      ttlSeconds: 60,
    });
    const response = await app.request(
      `https://example.test/${service}/download/123456`,
      undefined,
      ENV,
      {
        passThroughOnException: () => {},
        props: {},
        waitUntil: (task: Promise<unknown>) => {
          tasks.push(task);
        },
      },
    );
    await Promise.all(tasks);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Internal Server Error',
    });
    const events = requests.map(
      (body) =>
        JSON.parse(body) as {
          event: string;
          properties: { duration_ms: number; status: number };
        },
    );
    expect(
      events.filter((event) => event.event === 'request_failed'),
    ).toHaveLength(1);
    const completed = events.filter(
      (event) => event.event === 'request_completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]?.properties.status).toBe(500);
    expect(completed[0]?.properties.duration_ms).toBeGreaterThanOrEqual(0);
    expect(errors).toHaveBeenCalledOnce();
    const output = requests.join('') + JSON.stringify(errors.mock.calls);
    expect(output).not.toContain(PRIVATE);
    expect(output).not.toContain('123456');
  },
);

it('drops arbitrary properties, event names, dynamic routes and revision overrides', () => {
  expect(sanitizeProperties('$exception', { value: PRIVATE })).toBeNull();
  expect(
    sanitizeProperties('catalog_query', {
      analytics_schema_version: 99,
      build_revision: 'b'.repeat(40),
      cache_hit: true,
      query: PRIVATE,
      result_count: 3,
      route: `/diplomas/${PRIVATE}`,
    }),
  ).toMatchObject({
    $process_person_profile: false,
    analytics_schema_version: 2,
    cache_hit: true,
    result_count: 3,
    route: 'unmatched',
  });
  expect(
    JSON.stringify(sanitizeProperties('catalog_query', { query: PRIVATE })),
  ).not.toContain(PRIVATE);
});
