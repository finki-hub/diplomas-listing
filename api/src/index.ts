import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

import { fetchDiplomaFile, fetchDiplomaList } from '@/fetch.js';

import { AuthManager, casAuthErrorMessage } from './auth.js';
import { parseDiplomas, validate } from './utils.js';

type Bindings = {
  CAS_PASSWORD: string;
  CAS_USERNAME: string;
};

type Variables = {
  auth: AuthManager;
};

const CACHE_KEY = 'https://diplomski-api.finki-hub.com/diplomas';
const DIPLOMA_LIST_CACHE_TTL = 3_600; // 1 hour
const STATIC_FILE_CACHE_TTL = 31_536_000; // 1 year

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
      return new Response(cachedResponse.body, cachedResponse);
    }

    const diplomasResponse = await fetchDiplomaList(c.get('auth'));
    const diplomasHtml = await diplomasResponse.text();

    const diplomas = parseDiplomas(diplomasHtml);

    if (diplomas.length === 0) {
      return c.json(
        { error: 'No diplomas found — authentication may have failed' },
        502,
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
