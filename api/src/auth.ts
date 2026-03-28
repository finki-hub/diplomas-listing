import { CasAuthentication, Service } from 'finki-auth';

const DIPLOMAS_LIST_URL = 'https://diplomski.finki.ukim.mk/DiplomaList';

export const authenticateAndFetch = async (
  username: string,
  password: string,
): Promise<Response> => {
  const auth = new CasAuthentication({ password, username });

  await auth.authenticate(Service.DIPLOMAS);

  const cookieHeader = await auth.buildCookieHeader(Service.DIPLOMAS);

  return await fetch(DIPLOMAS_LIST_URL, {
    headers: {
      Cookie: cookieHeader,
    },
  });
};
