import type { AuthManager } from 'theses-listing-shared/src/auth.js';

import { Service } from 'finki-auth';

const DIPLOMAS_LIST_URL = 'https://diplomski.finki.ukim.mk/DiplomaList';
const DIPLOMAS_FILE_URL = 'https://diplomski.finki.ukim.mk/Upload/PublicFile/';

export const fetchDiplomaList = async (
  auth: AuthManager,
  signal: AbortSignal | null = null,
): Promise<Response> => {
  const cookieHeader = await auth.getValidCookieHeader(Service.DIPLOMAS);

  return fetch(DIPLOMAS_LIST_URL, {
    headers: { Cookie: cookieHeader },
    signal,
  });
};

export const fetchDiplomaFile = async (
  auth: AuthManager,
  id: string,
): Promise<Response> => {
  const cookieHeader = await auth.getValidCookieHeader(Service.DIPLOMAS);

  return fetch(`${DIPLOMAS_FILE_URL}${id}`, {
    headers: { Cookie: cookieHeader },
  });
};
