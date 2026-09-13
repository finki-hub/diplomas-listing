import { zValidator } from '@hono/zod-validator';
import { Hono, type ValidationTargets } from 'hono';
import { cors } from 'hono/cors';
import { z, type ZodType } from 'zod';

import { type AuthManager, casAuthErrorMessage } from './auth.js';
import { type CatalogListOptions, handleCatalogList } from './catalog-list.js';
import {
  type CatalogWorkerEnv,
  createAuthMiddleware,
  createAuthResolver,
  createRequestAnalyticsMiddleware,
} from './worker-utils.js';

type CatalogAppOptions<Item> = CatalogListOptions<Item> & {
  readonly corsExposeHeaders: readonly string[];
  readonly download?: DownloadRouteOptions;
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
    .get(options.listPath, (c) => handleCatalogList(c, options));

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
