import type { Context } from 'hono';

import type { AuthManager } from './auth.js';

import {
  type AnalyticsConfig,
  captureAnalytics,
  type CatalogWorkerEnv,
  createCachedJsonResponse,
} from './worker-utils.js';

export type CatalogListOptions<Item> = {
  readonly analytics: AnalyticsConfig;
  readonly cacheKey: string;
  readonly emptyError: string;
  readonly fetchItems: (
    auth: AuthManager,
    signal: AbortSignal,
  ) => Promise<readonly Item[]>;
  readonly listPath: string;
  readonly staleTtlSeconds: number;
  readonly timeoutMs: number;
  readonly ttlSeconds: number;
};

export class CatalogUpstreamResponseError extends Error {
  public readonly status: number;

  public constructor(status: number, options?: ErrorOptions) {
    super(`Upstream service returned ${String(status)}`, options);
    this.name = 'CatalogUpstreamResponseError';
    this.status = status;
  }
}

export class CatalogUpstreamTimeoutError extends Error {
  public readonly timeoutMs: number;

  public constructor(timeoutMs: number, options?: ErrorOptions) {
    super(`Catalog upstream timed out after ${String(timeoutMs)} ms`, options);
    this.name = 'CatalogUpstreamTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

const createStaleCacheKey = (cacheKey: string): string => {
  const staleUrl = new URL(cacheKey);

  staleUrl.searchParams.set('__catalog_stale', '1');

  return staleUrl.href;
};

const fetchItemsWithDeadline = async <Item>(
  options: CatalogListOptions<Item>,
  auth: AuthManager,
): Promise<readonly Item[]> => {
  const controller = new AbortController();
  const timeoutError = new CatalogUpstreamTimeoutError(options.timeoutMs);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort(timeoutError);
      reject(timeoutError);
    }, options.timeoutMs);
  });

  try {
    return await Promise.race([
      options.fetchItems(auth, controller.signal),
      timeout,
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
};

type CatalogQueryOptions<Item> = {
  readonly c: Context<CatalogWorkerEnv>;
  readonly cacheHit: boolean;
  readonly config: CatalogListOptions<Item>;
  readonly resultCount?: number;
};

const captureCatalogQuery = <Item>(
  options: CatalogQueryOptions<Item>,
): void => {
  const properties: Record<string, unknown> = {
    // eslint-disable-next-line camelcase -- PostHog property is snake_case.
    cache_hit: options.cacheHit,
    route: options.config.listPath,
  };

  if (options.resultCount !== undefined) {
    // eslint-disable-next-line camelcase -- PostHog property is snake_case.
    properties.result_count = options.resultCount;
  }

  captureAnalytics({
    c: options.c,
    config: options.config.analytics,
    event: 'catalog_query',
    properties,
  });
};

type StaleResponseOptions = {
  readonly cachedResponse: Response;
  readonly durationMs: number;
  readonly reason: string;
  readonly route: string;
  readonly service: string;
};

const createStaleResponse = (options: StaleResponseOptions): Response => {
  console.warn(
    JSON.stringify({
      durationMs: options.durationMs,
      event: 'catalog_stale_fallback',
      reason: options.reason,
      route: options.route,
      service: options.service,
    }),
  );

  const headers = new Headers(options.cachedResponse.headers);

  headers.set('Cache-Control', 'no-store');
  headers.set('Warning', '110 - "Response is stale"');
  headers.set('X-Data-Stale', 'true');

  return new Response(options.cachedResponse.body, {
    headers,
    status: options.cachedResponse.status,
  });
};

const getErrorReason = (error: unknown): string =>
  error instanceof Error ? error.name : 'UnknownError';

export const handleCatalogList = async <Item>(
  c: Context<CatalogWorkerEnv>,
  options: CatalogListOptions<Item>,
): Promise<Response> => {
  const cache = caches.default;
  const cachedResponse = await cache.match(options.cacheKey);

  if (cachedResponse) {
    captureCatalogQuery({ c, cacheHit: true, config: options });

    return new Response(cachedResponse.body, cachedResponse);
  }

  const staleCacheKey = createStaleCacheKey(options.cacheKey);
  const startedAt = Date.now();

  try {
    const items = await fetchItemsWithDeadline(options, c.get('auth'));

    if (items.length === 0) {
      captureAnalytics({
        c,
        config: options.analytics,
        event: 'query_zero_results',
        properties: {
          // eslint-disable-next-line camelcase -- PostHog property is snake_case.
          cache_hit: false,
          route: options.listPath,
        },
      });

      const staleResponse = await cache.match(staleCacheKey);

      if (staleResponse) {
        return createStaleResponse({
          cachedResponse: staleResponse,
          durationMs: Date.now() - startedAt,
          reason: 'empty_result',
          route: options.listPath,
          service: options.analytics.service,
        });
      }

      return c.json({ error: options.emptyError }, 502);
    }

    captureCatalogQuery({
      c,
      cacheHit: false,
      config: options,
      resultCount: items.length,
    });

    return createCachedJsonResponse({
      cache,
      cacheKey: options.cacheKey,
      executionCtx: c.executionCtx,
      staleCacheKey,
      staleTtlSeconds: options.staleTtlSeconds,
      ttlSeconds: options.ttlSeconds,
      // eslint-disable-next-line unicorn/prefer-temporal -- Temporal is not available in the target Workers runtime.
      updatedAt: new Date().toISOString(),
      value: items,
    });
  } catch (error) {
    const staleResponse = await cache.match(staleCacheKey);

    if (staleResponse) {
      return createStaleResponse({
        cachedResponse: staleResponse,
        durationMs: Date.now() - startedAt,
        reason: getErrorReason(error),
        route: options.listPath,
        service: options.analytics.service,
      });
    }

    if (error instanceof CatalogUpstreamTimeoutError) {
      console.error(
        JSON.stringify({
          event: 'catalog_upstream_timeout',
          route: options.listPath,
          service: options.analytics.service,
          timeoutMs: error.timeoutMs,
        }),
      );

      return c.json({ error: 'Upstream service timed out' }, 504, {
        'Cache-Control': 'no-store',
      });
    }

    if (error instanceof CatalogUpstreamResponseError) {
      console.error(
        JSON.stringify({
          event: 'catalog_upstream_response_error',
          route: options.listPath,
          service: options.analytics.service,
          status: error.status,
        }),
      );

      return c.json({ error: error.message }, 502, {
        'Cache-Control': 'no-store',
      });
    }

    throw error;
  }
};
