import { zValidator } from '@hono/zod-validator';
import { type Context, Hono, type ValidationTargets } from 'hono';
import { cors } from 'hono/cors';
import { z, type ZodType } from 'zod';

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
  readonly download?: DownloadRouteOptions;
  readonly emptyError: string;
  readonly fetchItems: (auth: AuthManager) => Promise<readonly Item[]>;
  readonly listPath: string;
  readonly ttlSeconds: number;
};

type DownloadRouteOptions = {
  readonly fallbackFilename: (id: string) => string;
  readonly fetchFile: (auth: AuthManager, id: string) => Promise<Response>;
  readonly path: string;
};

const STATIC_FILE_CACHE_TTL = 31_536_000; // 1 year

const FILE_ID_PARAM_SCHEMA = z.object({
  id: z.string().regex(/^\d+$/u, 'Invalid file ID'),
});

const validate = <
  Target extends keyof ValidationTargets,
  Schema extends ZodType,
>(
  target: Target,
  schema: Schema,
) =>
  // eslint-disable-next-line sonarjs/no-inconsistent-returns -- zValidator requires returning a response only when validation fails.
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message ?? 'Invalid input';

      return c.json({ error: errorMessage }, 400);
    }

    // eslint-disable-next-line consistent-return, no-useless-return, sonarjs/no-redundant-jump -- Returning no response tells zValidator to continue to the route handler.
    return;
  });

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

  const app = new Hono<CatalogWorkerEnv>()
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

  const { download } = options;

  if (download) {
    app.get(
      download.path,
      validate('param', FILE_ID_PARAM_SCHEMA),
      async (c) => {
        const { id } = c.req.valid('param');

        const fileResponse = await download.fetchFile(c.get('auth'), id);

        if (!fileResponse.ok) {
          return c.json(
            { error: `Upstream error: ${fileResponse.status}` },
            502,
          );
        }

        // Both upstreams report a missing file as 200 with an empty body
        // instead of an error status.
        if (fileResponse.headers.get('Content-Length') === '0') {
          return c.json({ error: 'File not found' }, 404);
        }

        const contentLength = fileResponse.headers.get('Content-Length');

        return new Response(fileResponse.body, {
          headers: {
            'Cache-Control': `public, max-age=${String(STATIC_FILE_CACHE_TTL)}, immutable`,
            'Content-Disposition':
              fileResponse.headers.get('Content-Disposition') ??
              `attachment; filename="${download.fallbackFilename(id)}"`,
            ...(contentLength !== null && { 'Content-Length': contentLength }),
            'Content-Type':
              fileResponse.headers.get('Content-Type') ??
              'application/octet-stream',
          },
          status: fileResponse.status,
        });
      },
    );
  }

  return app;
};
