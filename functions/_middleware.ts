import { redirectAliasHost } from '../shared/src/host-redirect.js';

const WEB_HOST_ALIASES = {
  'diplomas.finki-hub.com': 'theses.finki-hub.com',
  'masters.finki-hub.com': 'theses.finki-hub.com',
  'diplomski.finki-hub.com': 'trudovi.finki-hub.com',
  'magisterski.finki-hub.com': 'trudovi.finki-hub.com',
} as const;

type PagesMiddlewareContext = {
  readonly next: () => Promise<Response>;
  readonly request: Request;
};

export const onRequest = async ({ request, next }: PagesMiddlewareContext) =>
  redirectAliasHost(request, { aliases: WEB_HOST_ALIASES, status: 301 }) ?? next();
