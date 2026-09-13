import { createCatalogApp } from 'diplomas-listing-shared/src/catalog-app.js';
import { CatalogUpstreamResponseError } from 'diplomas-listing-shared/src/catalog-list.js';
import { createCachedJsonResponse } from 'diplomas-listing-shared/src/worker-utils.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CACHE_KEY = 'https://example.com/diplomas';
const STALE_CACHE_KEY = 'https://example.com/diplomas?__catalog_stale=1';
const ENV = {
  CAS_PASSWORD: 'password',
  CAS_USERNAME: 'username',
  POSTHOG_HOST: '',
  POSTHOG_KEY: '',
};

type DiplomaFixture = {
  readonly title: string;
};

class MemoryCache {
  private readonly responses = new Map<string, Response>();

  public match(cacheKey: string): Promise<Response | undefined> {
    return Promise.resolve(this.responses.get(cacheKey)?.clone());
  }

  public put(cacheKey: string, response: Response): Promise<void> {
    this.responses.set(cacheKey, response.clone());

    return Promise.resolve();
  }

  public seed(cacheKey: string, response: Response): void {
    this.responses.set(cacheKey, response);
  }
}

const createTestApp = (
  fetchItems: (signal: AbortSignal) => Promise<readonly DiplomaFixture[]>,
) =>
  createCatalogApp({
    analytics: {
      distinctId: 'catalog-test',
      service: 'catalog-test',
    },
    cacheKey: CACHE_KEY,
    corsExposeHeaders: [],
    emptyError: 'No items found',
    fetchItems: (_auth, signal) => fetchItems(signal),
    listPath: '/diplomas',
    staleTtlSeconds: 86_400,
    timeoutMs: 5,
    ttlSeconds: 3_600,
  });

const waitForAbort = (
  signal: AbortSignal,
): Promise<readonly DiplomaFixture[]> =>
  new Promise((_resolve, reject) => {
    signal.addEventListener(
      'abort',
      () => {
        reject(
          signal.reason instanceof Error
            ? signal.reason
            : new Error('Request aborted'),
        );
      },
      { once: true },
    );
  });

describe('catalog list resilience', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    vi.stubGlobal('caches', { default: cache });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 504 when the upstream operation exceeds its deadline', async () => {
    // Given
    const app = createTestApp(waitForAbort);

    // When
    const response = await app.request(CACHE_KEY, undefined, ENV);

    // Then
    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      error: 'Upstream service timed out',
    });
  });

  it('serves the last successful response when a refresh fails', async () => {
    // Given
    const diplomas = [{ title: 'Available diploma' }] as const;
    const app = createTestApp(() => {
      throw new Error('Upstream unavailable');
    });
    cache.seed(
      STALE_CACHE_KEY,
      Response.json(diplomas, {
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'X-Data-Updated-At': '2026-09-10T08:30:00.000Z',
        },
      }),
    );

    // When
    const response = await app.request(CACHE_KEY, undefined, ENV);

    // Then
    expect(response.status).toBe(200);
    expect(response.headers.get('Warning')).toBe('110 - "Response is stale"');
    expect(response.headers.get('X-Data-Stale')).toBe('true');
    expect(response.headers.get('X-Data-Updated-At')).toBe(
      '2026-09-10T08:30:00.000Z',
    );
    await expect(response.json()).resolves.toEqual(diplomas);
  });

  it('returns 502 when the upstream responds with an error status', async () => {
    // Given
    const app = createTestApp(() => {
      throw new CatalogUpstreamResponseError(503);
    });

    // When
    const response = await app.request(CACHE_KEY, undefined, ENV);

    // Then
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'Upstream service returned 503',
    });
  });

  it('uses the fresh cache without contacting the upstream again', async () => {
    // Given
    const fetchItems = vi.fn<() => Promise<readonly DiplomaFixture[]>>();
    const app = createTestApp(fetchItems);
    cache.seed(CACHE_KEY, Response.json([{ title: 'Cached diploma' }]));

    // When
    const response = await app.request(CACHE_KEY, undefined, ENV);

    // Then
    expect(response.status).toBe(200);
    expect(fetchItems).not.toHaveBeenCalled();
  });

  it('retains a separate last-known-good response after a refresh', async () => {
    // Given
    const backgroundTasks: Array<Promise<unknown>> = [];

    // When
    const response = createCachedJsonResponse({
      cache,
      cacheKey: CACHE_KEY,
      executionCtx: {
        waitUntil: (promise) => {
          backgroundTasks.push(promise);
        },
      },
      staleCacheKey: STALE_CACHE_KEY,
      staleTtlSeconds: 86_400,
      ttlSeconds: 3_600,
      updatedAt: '2026-09-13T20:00:00.000Z',
      value: [{ title: 'Fresh diploma' }],
    });
    await Promise.all(backgroundTasks);

    // Then
    expect(response.status).toBe(200);
    const staleResponse = await cache.match(STALE_CACHE_KEY);
    expect(response.headers.get('X-Data-Updated-At')).toBe(
      '2026-09-13T20:00:00.000Z',
    );
    expect(staleResponse?.headers.get('Cache-Control')).toBe(
      'public, max-age=86400',
    );
    expect(staleResponse?.headers.get('X-Data-Updated-At')).toBe(
      '2026-09-13T20:00:00.000Z',
    );
    await expect(staleResponse?.json()).resolves.toEqual([
      { title: 'Fresh diploma' },
    ]);
  });
});
