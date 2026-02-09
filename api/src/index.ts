import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { authenticateAndFetch } from './auth.js';
import { isAuthenticated, parseDiplomas } from './utils.js';

type Bindings = {
  CAS_PASSWORD: string;
  CAS_USERNAME: string;
};

const CACHE_KEY = 'https://diplomski-api.finki-hub.com/diplomas';
const CACHE_TTL_SECONDS = 3_600; // 1 hour

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/diplomas', async (c) => {
  try {
    const cache = caches.default;
    const cachedResponse = await cache.match(CACHE_KEY);

    if (cachedResponse) {
      return new Response(cachedResponse.body, cachedResponse);
    }

    if (!c.env.CAS_USERNAME || !c.env.CAS_PASSWORD) {
      return c.json({ error: 'CAS credentials are not configured' }, 500);
    }

    const html = await authenticateAndFetch(
      c.env.CAS_USERNAME,
      c.env.CAS_PASSWORD,
    );

    if (!isAuthenticated(html)) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const diplomas = parseDiplomas(html);

    if (diplomas.length === 0) {
      return c.json(
        { error: 'No diplomas found — authentication may have failed' },
        502,
      );
    }

    const response = c.json(diplomas);

    const responseToCache = Response.json(diplomas, {
      headers: {
        'Cache-Control': `public, max-age=${String(CACHE_TTL_SECONDS)}`,
      },
    });

    c.executionCtx.waitUntil(cache.put(CACHE_KEY, responseToCache));

    return response;
  } catch (error) {
    console.error('Failed to fetch diplomas:', error);

    return c.json({ error: 'Failed to fetch diplomas' }, 500);
  }
});

export default app;
