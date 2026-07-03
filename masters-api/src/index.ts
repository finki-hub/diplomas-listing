import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { MasterThesis } from '@/utils.js';

import { fetchMastersListPage, PAGE_SIZE } from '@/fetch.js';

import { AuthManager, casAuthErrorMessage } from './auth.js';
import { parseMasterTheses } from './utils.js';

type Bindings = {
  CAS_PASSWORD: string;
  CAS_USERNAME: string;
  POSTHOG_HOST: string;
  POSTHOG_KEY: string;
};

type Variables = {
  auth: AuthManager;
};

const CACHE_KEY = 'https://magisterski-api.finki-hub.com/masters';
const MASTERS_LIST_CACHE_TTL = 3_600; // 1 hour
// Safety valve in case the catalog ever outgrows the upstream page size.
const MAX_PAGES = 3;
const WORKER_DISTINCT_ID = 'masters-api-worker';
const WORKER_SERVICE = 'masters-api';

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

const fetchAllMasterTheses = async (
  auth: AuthManager,
): Promise<MasterThesis[]> => {
  const theses: MasterThesis[] = [];

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const listResponse = await fetchMastersListPage(auth, pageNum);
    const parsed = parseMasterTheses(await listResponse.text());

    theses.push(...parsed);

    if (parsed.length < PAGE_SIZE) break;
  }

  return theses;
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
    const status = caughtError === undefined ? c.res.status : 500;
    let outcome: string;
    if (status < 400) {
      outcome = 'ok';
    } else if (status < 500) {
      outcome = 'client_error';
    } else {
      outcome = 'server_error';
    }

    /* eslint-disable camelcase -- PostHog ingest API requires these keys */
    c.executionCtx.waitUntil(
      sendAnalytics(c.env.POSTHOG_HOST, {
        api_key: c.env.POSTHOG_KEY,
        distinct_id: WORKER_DISTINCT_ID,
        /* eslint-enable camelcase -- end PostHog key exception */
        event: 'request_completed',
        properties: {
          // eslint-disable-next-line camelcase -- PostHog property is snake_case.
          duration_ms: ms,
          method: c.req.method,
          outcome,
          // eslint-disable-next-line @typescript-eslint/no-deprecated -- hono/route routePath has a context generic mismatch; c.req.routePath is equivalent.
          route: c.req.routePath,
          service: WORKER_SERVICE,
          status,
        },
      }),
    );

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
                mechanism: { handled: false, synthetic: false },
                type:
                  caughtError instanceof Error
                    ? caughtError.constructor.name
                    : 'UnknownError',
                value:
                  caughtError instanceof Error
                    ? caughtError.message
                    : JSON.stringify(caughtError),
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
      exposeHeaders: ['Content-Type'],
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
  .get('/masters', async (c) => {
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
              route: '/masters',
              service: WORKER_SERVICE,
            },
          }),
        );
      }

      return new Response(cachedResponse.body, cachedResponse);
    }

    const theses = await fetchAllMasterTheses(c.get('auth'));

    if (theses.length === 0) {
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
              route: '/masters',
              service: WORKER_SERVICE,
            },
          }),
        );
      }

      return c.json(
        { error: 'No master theses found — authentication may have failed' },
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
            result_count: theses.length,
            route: '/masters',
            service: WORKER_SERVICE,
          },
        }),
      );
    }

    // Build the Response by hand so the array is serialized once, not twice
    // (c.json plus a cached Response.json would each stringify it).
    const body = JSON.stringify(theses);
    const contentType = 'application/json; charset=UTF-8';

    c.executionCtx.waitUntil(
      cache.put(
        CACHE_KEY,
        new Response(body, {
          headers: {
            'Cache-Control': `public, max-age=${String(MASTERS_LIST_CACHE_TTL)}`,
            'Content-Type': contentType,
          },
        }),
      ),
    );

    return new Response(body, { headers: { 'Content-Type': contentType } });
  });

export default app;
