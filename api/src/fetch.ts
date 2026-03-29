import { Service } from 'finki-auth';

import type { AuthManager } from '@/auth.js';

const DIPLOMAS_LIST_URL = 'https://diplomski.finki.ukim.mk/DiplomaList';
const DIPLOMAS_FILE_URL = 'https://diplomski.finki.ukim.mk/Upload/PublicFile/';

export const fetchDiplomaList = async (
  auth: AuthManager,
): Promise<Response> => {
  const cookieHeader = await auth.getValidCookieHeader(Service.DIPLOMAS);

  return fetch(DIPLOMAS_LIST_URL, {
    headers: { Cookie: cookieHeader },
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
