type RedirectAliasOptions = {
  readonly aliases: Readonly<Record<string, string>>;
  readonly allowAnyOrigin?: boolean;
  readonly skipOptions?: boolean;
  readonly status: 301 | 308;
};

export const redirectAliasHost = (
  request: Request,
  { aliases, allowAnyOrigin, skipOptions, status }: RedirectAliasOptions,
): null | Response => {
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
