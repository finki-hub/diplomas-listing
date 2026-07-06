import { createCatalogApp } from 'diplomas-listing-shared/src/catalog-app.js';
import { z } from 'zod';

import { fetchDiplomaFile, fetchDiplomaList } from '@/fetch.js';

import { parseDiplomas, validate } from './utils.js';

const CACHE_KEY = 'https://diplomski-api.finki-hub.com/diplomas';
const DIPLOMA_LIST_CACHE_TTL = 3_600; // 1 hour
const STATIC_FILE_CACHE_TTL = 31_536_000; // 1 year
const ANALYTICS = {
  distinctId: 'diplomas-api-worker',
  service: 'diplomas-api',
} as const;

const app = createCatalogApp({
  analytics: ANALYTICS,
  cacheKey: CACHE_KEY,
  corsExposeHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
  emptyError: 'No diplomas found — authentication may have failed',
  fetchItems: async (auth) => {
    const diplomasResponse = await fetchDiplomaList(auth);
    const diplomasHtml = await diplomasResponse.text();

    return parseDiplomas(diplomasHtml);
  },
  listPath: '/diplomas',
  ttlSeconds: DIPLOMA_LIST_CACHE_TTL,
}).get(
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
