import { createCatalogApp } from 'diplomas-listing-shared/src/catalog-app.js';
import { CatalogUpstreamResponseError } from 'diplomas-listing-shared/src/catalog-list.js';

import { fetchDiplomaFile, fetchDiplomaList } from '@/fetch.js';

import { parseDiplomas } from './utils.js';

const CACHE_KEY = 'https://diplomski-api.finki-hub.com/diplomas';
const DIPLOMA_LIST_CACHE_TTL = 3_600; // 1 hour
const DIPLOMA_LIST_STALE_TTL = 604_800; // 7 days
const UPSTREAM_TIMEOUT_MS = 30_000;
const ANALYTICS = {
  distinctId: 'diplomas-api-worker',
  service: 'diplomas-api',
} as const;

const app = createCatalogApp({
  analytics: ANALYTICS,
  cacheKey: CACHE_KEY,
  corsExposeHeaders: [
    'Content-Disposition',
    'Content-Length',
    'Content-Type',
    'Warning',
    'X-Data-Stale',
    'X-Data-Updated-At',
  ],
  download: {
    fallbackFilename: (id) => `diploma_${id}.pdf`,
    fetchFile: fetchDiplomaFile,
    path: '/diplomas/download/:id',
  },
  emptyError: 'No diplomas found — authentication may have failed',
  fetchItems: async (auth, signal) => {
    const diplomasResponse = await fetchDiplomaList(auth, signal);
    if (!diplomasResponse.ok) {
      throw new CatalogUpstreamResponseError(diplomasResponse.status);
    }

    const diplomasHtml = await diplomasResponse.text();

    return parseDiplomas(diplomasHtml);
  },
  listPath: '/diplomas',
  staleTtlSeconds: DIPLOMA_LIST_STALE_TTL,
  timeoutMs: UPSTREAM_TIMEOUT_MS,
  ttlSeconds: DIPLOMA_LIST_CACHE_TTL,
});

export default app;
