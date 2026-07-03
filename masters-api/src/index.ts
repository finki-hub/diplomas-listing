import type { MasterThesis } from '@/utils.js';

import { fetchMastersListPage, PAGE_SIZE } from '@/fetch.js';

import type { AuthManager } from '../../api/src/auth.js';

import { createCatalogApp } from '../../api/src/catalog-app.js';
import { parseMasterTheses } from './utils.js';

const CACHE_KEY = 'https://magisterski-api.finki-hub.com/masters';
const MASTERS_LIST_CACHE_TTL = 3_600; // 1 hour
// Safety valve in case the catalog ever outgrows the upstream page size.
const MAX_PAGES = 3;
const ANALYTICS = {
  distinctId: 'masters-api-worker',
  service: 'masters-api',
} as const;

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

const app = createCatalogApp({
  analytics: ANALYTICS,
  cacheKey: CACHE_KEY,
  corsExposeHeaders: ['Content-Type'],
  emptyError: 'No master theses found — authentication may have failed',
  fetchItems: fetchAllMasterTheses,
  listPath: '/masters',
  ttlSeconds: MASTERS_LIST_CACHE_TTL,
});

export default app;
