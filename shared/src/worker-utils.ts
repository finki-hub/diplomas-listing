import type { Context, MiddlewareHandler } from 'hono';

import { AuthManager } from './auth.js';

export type AnalyticsConfig = {
  readonly distinctId: string;
  readonly service: string;
};

export type CatalogBindings = {
  CAS_PASSWORD: string;
  CAS_USERNAME: string;
  POSTHOG_HOST: string;
  POSTHOG_KEY: string;
};

export type CatalogWorkerEnv = {
  Bindings: CatalogBindings;
  Variables: {
    auth: AuthManager;
  };
};

type AnalyticsEventOptions = {
  readonly c: Context<CatalogWorkerEnv>;
  readonly config: AnalyticsConfig;
  readonly event: string;
  readonly properties: AnalyticsProperties;
};

type AnalyticsProperties = Record<string, unknown>;

type CachedJsonResponseOptions = {
  readonly cache: {
    readonly put: (cacheKey: string, response: Response) => Promise<void>;
  };
  readonly cacheKey: string;
  readonly executionCtx: {
    readonly waitUntil: (promise: Promise<unknown>) => void;
  };
  readonly ttlSeconds: number;
  readonly value: unknown;
};

const JSON_CONTENT_TYPE = 'application/json; charset=UTF-8';

const getOutcome = (status: number): string => {
  if (status < 400) return 'ok';
  if (status < 500) return 'client_error';
  return 'server_error';
};

export const createAuthResolver = () => {
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

export const sendAnalytics = async (
  host: string,
  payload: unknown,
): Promise<void> => {
  try {
    await fetch(`${host}/i/v0/e/`, {
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
  } catch {} // eslint-disable-line no-empty -- analytics is best-effort.
};

export const captureAnalytics = (options: AnalyticsEventOptions): void => {
  const { c, config, event, properties } = options;

  if (!c.env.POSTHOG_KEY || !c.env.POSTHOG_HOST) return;

  c.executionCtx.waitUntil(
    sendAnalytics(c.env.POSTHOG_HOST, {
      // eslint-disable-next-line camelcase -- PostHog ingest API requires this key.
      api_key: c.env.POSTHOG_KEY,
      // eslint-disable-next-line camelcase -- PostHog ingest API requires this key.
      distinct_id: config.distinctId,
      event,
      properties: {
        ...properties,
        service: config.service,
      },
    }),
  );
};

export const createRequestAnalyticsMiddleware =
  (config: AnalyticsConfig): MiddlewareHandler<CatalogWorkerEnv> =>
  async (c, nextFn) => {
    const start = Date.now();
    let caughtError: unknown;

    try {
      await nextFn();
    } catch (error) {
      caughtError = error;
    }

    if (!c.env.POSTHOG_KEY || !c.env.POSTHOG_HOST) {
      if (caughtError instanceof Error) throw caughtError;
      if (caughtError !== undefined) {
        throw new Error('Non-error thrown by request handler', {
          cause: caughtError,
        });
      }

      return;
    }

    const status = caughtError === undefined ? c.res.status : 500;

    captureAnalytics({
      c,
      config,
      event: 'request_completed',
      properties: {
        // eslint-disable-next-line camelcase -- PostHog property is snake_case.
        duration_ms: Date.now() - start,
        method: c.req.method,
        outcome: getOutcome(status),
        route: c.req.path,
        status,
      },
    });

    if (caughtError !== undefined) {
      const { pathname } = new URL(c.req.url);

      captureAnalytics({
        c,
        config,
        event: '$exception',
        properties: {
          // eslint-disable-next-line camelcase -- PostHog property is snake_case.
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
        },
      });

      if (caughtError instanceof Error) throw caughtError;
      throw new Error('Non-error thrown by request handler', {
        cause: caughtError,
      });
    }
  };

export const createAuthMiddleware =
  (
    resolveAuth: ReturnType<typeof createAuthResolver>,
  ): MiddlewareHandler<CatalogWorkerEnv> =>
  async (c, nextFn) => {
    if (!c.env.CAS_USERNAME || !c.env.CAS_PASSWORD) {
      return c.json({ error: 'CAS credentials are not configured' }, 500);
    }

    c.set('auth', resolveAuth(c.env.CAS_USERNAME, c.env.CAS_PASSWORD));

    return nextFn();
  };

export const createCachedJsonResponse = (
  options: CachedJsonResponseOptions,
): Response => {
  const body = JSON.stringify(options.value);

  options.executionCtx.waitUntil(
    options.cache.put(
      options.cacheKey,
      new Response(body, {
        headers: {
          'Cache-Control': `public, max-age=${String(options.ttlSeconds)}`,
          'Content-Type': JSON_CONTENT_TYPE,
        },
      }),
    ),
  );

  return new Response(body, { headers: { 'Content-Type': JSON_CONTENT_TYPE } });
};
