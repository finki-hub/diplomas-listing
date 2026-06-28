import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

import { fetchDiplomaFile, fetchDiplomaList } from '@/fetch.js';

import { AuthManager, casAuthErrorMessage } from './auth.js';
import { parseDiplomas, validate } from './utils.js';

type Bindings = {
  CAS_PASSWORD: string;
  CAS_USERNAME: string;
  POSTHOG_HOST: string;
  POSTHOG_KEY: string;
};

type Variables = {
  auth: AuthManager;
};

const CACHE_KEY = 'https://diplomski-api.finki-hub.com/diplomas';
const DIPLOMA_LIST_CACHE_TTL = 3_600; // 1 hour
const STATIC_FILE_CACHE_TTL = 31_536_000; // 1 year
const WORKER_DISTINCT_ID = 'diplomas-api-worker';
const WORKER_SERVICE = 'diplomas-api';

const createAuthResolver = () => {
  let cached: null | {
    instance: AuthManager;
    password: string;
    username: string;
  } = null;

  return (username: string, password: string): AuthManager => {
    if (cached?.username !== username || cached.password !== password) {
      cached = {
        instance: new AuthManager(username, password),
        password,
        username,
      };
    }

    return cached.instance;
  };
};

const resolveAuth = createAuthResolver();

const sendAnalytics = async (host: string, payload: unknown): Promise<void> => {
  try {
    await fetch(`${host}/i/v0/e/`, {
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
  } catch {} // eslint-disable-line no-empty -- analytics is best-effort
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .onError((err, c) => {
    if (err.message === casAuthErrorMessage) {
      return c.json({ error: 'CAS authentication failed' }, 401);
    }

    console.error(err);
    return c.json({ error: 'Internal Server Error' }, 500);
  })
  .use('*', async (c, nextFn) => {
    const start = Date.now();

    let caughtError: unknown;

    try {
      await nextFn();
    } catch (error) {
      caughtError = error;
    }

    if (!c.env.POSTHOG_KEY || !c.env.POSTHOG_HOST) {
      if (caughtError !== undefined) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- re-throwing an unknown caught value.
        throw caughtError;
      }

      return;
    }

    const ms = Date.now() - start;
    const { pathname } = new URL(c.req.url);

    const payload = {
      /* eslint-disable camelcase -- PostHog ingest API requires these keys */
      api_key: c.env.POSTHOG_KEY,
      distinct_id: WORKER_DISTINCT_ID,
      /* eslint-enable camelcase -- end PostHog key exception */
      event: 'diplomas-api_query',
      properties: {
        ms,
        path: pathname,
        service: WORKER_SERVICE,
        status: caughtError === undefined ? c.res.status : 500,
      },
    };

    // waitUntil: fire-and-forget, off the synchronous CPU budget (free-plan 10ms cap).
    c.executionCtx.waitUntil(sendAnalytics(c.env.POSTHOG_HOST, payload));

    if (caughtError !== undefined) {
      /* eslint-disable camelcase -- PostHog ingest API requires these keys */
      c.executionCtx.waitUntil(
        sendAnalytics(c.env.POSTHOG_HOST, {
          api_key: c.env.POSTHOG_KEY,
          distinct_id: WORKER_DISTINCT_ID,
          /* eslint-enable camelcase -- end PostHog key exception */
          event: '$exception',
          properties: {
            // eslint-disable-next-line camelcase -- PostHog exception list property is snake_case.
            $exception_list: [
              {
                mechanism: { handled: false, type: 'generic' },
                type:
                  caughtError instanceof Error
                    ? caughtError.constructor.name
                    : 'UnknownError',
                value: '(metadata only)',
              },
            ],
            path: pathname,
            service: WORKER_SERVICE,
          },
        }),
      );

      // eslint-disable-next-line @typescript-eslint/only-throw-error -- re-throwing an unknown caught value.
      throw caughtError;
    }
  })
  .use(
    '*',
    cors({
      allowMethods: ['GET'],
      exposeHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
      origin: '*',
    }),
  )
  .use('*', async (c, nextFn) => {
    if (!c.env.CAS_USERNAME || !c.env.CAS_PASSWORD) {
      return c.json({ error: 'CAS credentials are not configured' }, 500);
    }

    c.set('auth', resolveAuth(c.env.CAS_USERNAME, c.env.CAS_PASSWORD));

    return nextFn();
  })
  .get('/diplomas', async (c) => {
    const cache = caches.default;
    const cachedResponse = await cache.match(CACHE_KEY);

    if (cachedResponse) {
      if (c.env.POSTHOG_KEY && c.env.POSTHOG_HOST) {
        /* eslint-disable camelcase -- PostHog ingest API requires snake_case keys */
        c.executionCtx.waitUntil(
          sendAnalytics(c.env.POSTHOG_HOST, {
            api_key: c.env.POSTHOG_KEY,
            distinct_id: WORKER_DISTINCT_ID,
            /* eslint-enable camelcase -- end PostHog key exception */
            event: 'catalog_query',
            properties: {
              // eslint-disable-next-line camelcase -- PostHog property is snake_case.
              cache_hit: true,
              route: '/diplomas',
              service: WORKER_SERVICE,
            },
          }),
        );
      }

      return new Response(cachedResponse.body, cachedResponse);
    }

    const diplomasResponse = await fetchDiplomaList(c.get('auth'));
    const diplomasHtml = await diplomasResponse.text();

    const diplomas = parseDiplomas(diplomasHtml);

    if (diplomas.length === 0) {
      if (c.env.POSTHOG_KEY && c.env.POSTHOG_HOST) {
        c.executionCtx.waitUntil(
          sendAnalytics(c.env.POSTHOG_HOST, {
            /* eslint-disable camelcase -- PostHog ingest API requires snake_case keys */
            api_key: c.env.POSTHOG_KEY,
            distinct_id: WORKER_DISTINCT_ID,
            /* eslint-enable camelcase -- end PostHog key exception */
            event: 'query_zero_results',
            properties: {
              // eslint-disable-next-line camelcase -- PostHog property is snake_case.
              cache_hit: false,
              route: '/diplomas',
              service: WORKER_SERVICE,
            },
          }),
        );
      }

      return c.json(
        { error: 'No diplomas found — authentication may have failed' },
        502,
      );
    }

    if (c.env.POSTHOG_KEY && c.env.POSTHOG_HOST) {
      /* eslint-disable camelcase -- PostHog ingest API requires snake_case keys */
      c.executionCtx.waitUntil(
        sendAnalytics(c.env.POSTHOG_HOST, {
          api_key: c.env.POSTHOG_KEY,
          distinct_id: WORKER_DISTINCT_ID,
          /* eslint-enable camelcase -- end PostHog key exception */
          event: 'catalog_query',
          properties: {
            // eslint-disable-next-line camelcase -- PostHog property is snake_case.
            cache_hit: false,
            // eslint-disable-next-line camelcase -- PostHog property is snake_case.
            result_count: diplomas.length,
            route: '/diplomas',
            service: WORKER_SERVICE,
          },
        }),
      );
    }

    // Build the Response by hand so the array is serialized once, not twice
    // (c.json plus a cached Response.json would each stringify it).
    const body = JSON.stringify(diplomas);
    const contentType = 'application/json; charset=UTF-8';

    c.executionCtx.waitUntil(
      cache.put(
        CACHE_KEY,
        new Response(body, {
          headers: {
            'Cache-Control': `public, max-age=${String(DIPLOMA_LIST_CACHE_TTL)}`,
            'Content-Type': contentType,
          },
        }),
      ),
    );

    return new Response(body, { headers: { 'Content-Type': contentType } });
  })
  .get(
    '/download/:id',
    validate(
      'param',
      z.object({
        id: z.string().regex(/^\d+$/u, 'Invalid file ID'),
      }),
    ),
    async (c) => {
      const { id } = c.req.valid('param');

      const fileResponse = await fetchDiplomaFile(c.get('auth'), id);

      if (!fileResponse.ok) {
        return c.json({ error: `Upstream error: ${fileResponse.status}` }, 502);
      }

      if (fileResponse.headers.get('Content-Length') === '0') {
        return c.json({ error: 'File not found' }, 404);
      }

      const contentLength = fileResponse.headers.get('Content-Length');

      return new Response(fileResponse.body, {
        headers: {
          'Cache-Control': `public, max-age=${String(STATIC_FILE_CACHE_TTL)}, immutable`,
          'Content-Disposition':
            fileResponse.headers.get('Content-Disposition') ??
            `attachment; filename="diploma_${id}.pdf"`,
          ...(contentLength !== null && { 'Content-Length': contentLength }),
          'Content-Type':
            fileResponse.headers.get('Content-Type') ??
            'application/octet-stream',
        },
        status: fileResponse.status,
      });
    },
  );

export default app;
