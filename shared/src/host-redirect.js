/**
 * Redirect an explicitly allowlisted request hostname while preserving its
 * path and query. Returns null for all other hosts and skipped methods.
 *
 * @param {Request} request The incoming request.
 * @param {{ aliases: Readonly<Record<string, string>>, allowAnyOrigin?: boolean, status: 301 | 308, skipOptions?: boolean }} options Redirect configuration.
 * @returns {Response | null} Redirect response, or null when it should pass through.
 */
export const redirectAliasHost = (
  request,
  { aliases, allowAnyOrigin, skipOptions, status },
) => {
  if (skipOptions && request.method === 'OPTIONS') return null;

  const source = new URL(request.url);
  if (!Object.hasOwn(aliases, source.hostname)) return null;
  const targetHost = aliases[source.hostname];
  if (!targetHost) return null;

  source.protocol = 'https:';
  source.username = '';
  source.password = '';
  source.host = targetHost;

  const headers = new Headers({ Location: source.href });
  if (allowAnyOrigin) headers.set('Access-Control-Allow-Origin', '*');

  return new Response(null, { headers, status });
};
