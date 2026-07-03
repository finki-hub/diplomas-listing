import { Service } from 'finki-auth';

import type { AuthManager } from '@/auth.js';

const MASTERS_LIST_URL = 'https://magisterski.finki.ukim.mk/list-master-thesis';

// The largest page size the upstream listing offers; the catalog currently
// fits in a single page.
export const PAGE_SIZE = 1_000;

export const fetchMastersListPage = async (
  auth: AuthManager,
  pageNum: number,
): Promise<Response> => {
  const cookieHeader = await auth.getValidCookieHeader(Service.MASTERS);

  return fetch(
    `${MASTERS_LIST_URL}?results=${String(PAGE_SIZE)}&pageNum=${String(pageNum)}`,
    {
      headers: { Cookie: cookieHeader },
    },
  );
};
