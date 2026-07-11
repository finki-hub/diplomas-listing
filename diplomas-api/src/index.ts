import { createCatalogApp } from 'diplomas-listing-shared/src/catalog-app.js';

import { fetchDiplomaFile, fetchDiplomaList } from '@/fetch.js';

import { parseDiplomas } from './utils.js';

const CACHE_KEY = 'https://diplomski-api.finki-hub.com/diplomas';
const DIPLOMA_LIST_CACHE_TTL = 3_600; // 1 hour
const ANALYTICS = {
  distinctId: 'diplomas-api-worker',
  service: 'diplomas-api',
} as const;

const app = createCatalogApp({
  analytics: ANALYTICS,
  cacheKey: CACHE_KEY,
  corsExposeHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
  download: {
    fallbackFilename: (id) => `diploma_${id}.pdf`,
    fetchFile: fetchDiplomaFile,
    path: '/diplomas/download/:id',
  },
  emptyError: 'No diplomas found — authentication may have failed',
  fetchItems: async (auth) => {
    const diplomasResponse = await fetchDiplomaList(auth);
    const diplomasHtml = await diplomasResponse.text();

    return parseDiplomas(diplomasHtml);
  },
  listPath: '/diplomas',
  ttlSeconds: DIPLOMA_LIST_CACHE_TTL,
});

export default app;
