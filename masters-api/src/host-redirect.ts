import { redirectAliasHost } from 'theses-listing-shared/src/host-redirect.js';

const API_HOST_ALIASES = {
  'magisterski-api.finki-hub.com': 'masters-api.finki-hub.com',
} as const;

export const handleMastersApiRequest = (
  request: Request,
  next: () => Promise<Response> | Response,
) =>
  redirectAliasHost(request, {
    aliases: API_HOST_ALIASES,
    allowAnyOrigin: true,
    skipOptions: true,
    status: 308,
  }) ?? next();
