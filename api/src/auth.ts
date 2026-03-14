import { CasAuthentication, Service } from 'finki-auth';

const DIPLOMAS_LIST_URL = 'https://diplomski.finki.ukim.mk/DiplomaList';

export const authenticateAndFetch = async (
  username: string,
  password: string,
): Promise<string> => {
  const auth = new CasAuthentication({ password, username });

  await auth.authenticate(Service.DIPLOMAS);

  const cookieHeader = await auth.buildCookieHeader(Service.DIPLOMAS);

  const diplomaResponse = await fetch(DIPLOMAS_LIST_URL, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  return diplomaResponse.text();
};
