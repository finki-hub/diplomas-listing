import { redirectAliasHost } from 'theses-listing-shared/src/host-redirect.js';

const API_HOST_ALIASES = {
  'diplomas-api.finki-hub.com': 'bachelors-api.finki-hub.com',
  'diplomski-api.finki-hub.com': 'bachelors-api.finki-hub.com',
} as const;

export const handleBachelorsApiRequest = (
  request: Request,
  next: () => Promise<Response> | Response,
) =>
  redirectAliasHost(request, {
    aliases: API_HOST_ALIASES,
    allowAnyOrigin: true,
    skipOptions: true,
    status: 308,
  }) ?? next();
