import type { AuthManager } from 'diplomas-listing-shared/src/auth.js';

import { Service } from 'finki-auth';

const MASTERS_LIST_URL = 'https://magisterski.finki.ukim.mk/list-master-thesis';
const MASTERS_FILE_URL =
  'https://magisterski.finki.ukim.mk/manage-thesis/download/';

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

export const fetchMasterThesisFile = async (
  auth: AuthManager,
  id: string,
): Promise<Response> => {
  const cookieHeader = await auth.getValidCookieHeader(Service.MASTERS);

  return fetch(`${MASTERS_FILE_URL}${id}`, {
    headers: { Cookie: cookieHeader },
  });
};
