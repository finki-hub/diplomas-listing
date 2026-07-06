import { type Context, Hono } from 'hono';
import { cors } from 'hono/cors';

import { type AuthManager, casAuthErrorMessage } from './auth.js';
import {
  type AnalyticsConfig,
  captureAnalytics,
  type CatalogWorkerEnv,
  createAuthMiddleware,
  createAuthResolver,
  createCachedJsonResponse,
  createRequestAnalyticsMiddleware,
} from './worker-utils.js';

type CatalogAppOptions<Item> = {
  readonly analytics: AnalyticsConfig;
  readonly cacheKey: string;
  readonly corsExposeHeaders: readonly string[];
  readonly emptyError: string;
  readonly fetchItems: (auth: AuthManager) => Promise<readonly Item[]>;
  readonly listPath: string;
  readonly ttlSeconds: number;
};

type CatalogQueryOptions = {
  readonly c: Context<CatalogWorkerEnv>;
  readonly cacheHit: boolean;
  readonly config: AnalyticsConfig;
  readonly resultCount?: number;
  readonly route: string;
};

const captureCatalogQuery = (options: CatalogQueryOptions): void => {
  const properties: Record<string, unknown> = {
    // eslint-disable-next-line camelcase -- PostHog property is snake_case.
    cache_hit: options.cacheHit,
    route: options.route,
  };

  if (options.resultCount !== undefined) {
    // eslint-disable-next-line camelcase -- PostHog property is snake_case.
    properties.result_count = options.resultCount;
  }

  captureAnalytics({
    c: options.c,
    config: options.config,
    event: 'catalog_query',
    properties,
  });
};

export const createCatalogApp = <Item>(
  options: CatalogAppOptions<Item>,
): Hono<CatalogWorkerEnv> => {
  const resolveAuth = createAuthResolver();

  return new Hono<CatalogWorkerEnv>()
    .onError((err, c) => {
      if (err.message === casAuthErrorMessage) {
        return c.json({ error: 'CAS authentication failed' }, 401);
      }

      console.error(err);
      return c.json({ error: 'Internal Server Error' }, 500);
    })
    .use('*', createRequestAnalyticsMiddleware(options.analytics))
    .use(
      '*',
      cors({
        allowMethods: ['GET'],
        exposeHeaders: [...options.corsExposeHeaders],
        origin: '*',
      }),
    )
    .use('*', createAuthMiddleware(resolveAuth))
    .get(options.listPath, async (c) => {
      const cache = caches.default;
      const cachedResponse = await cache.match(options.cacheKey);

      if (cachedResponse) {
        captureCatalogQuery({
          c,
          cacheHit: true,
          config: options.analytics,
          route: options.listPath,
        });

        return new Response(cachedResponse.body, cachedResponse);
      }

      const items = await options.fetchItems(c.get('auth'));

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

        return c.json({ error: options.emptyError }, 502);
      }

      captureCatalogQuery({
        c,
        cacheHit: false,
        config: options.analytics,
        resultCount: items.length,
        route: options.listPath,
      });

      return createCachedJsonResponse({
        cache,
        cacheKey: options.cacheKey,
        executionCtx: c.executionCtx,
        ttlSeconds: options.ttlSeconds,
        value: items,
      });
    });
};
