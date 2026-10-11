import { pathToFileURL } from 'node:url';

const CANONICAL_WEB_HOSTS = [
  'https://theses.finki-hub.com',
  'https://trudovi.finki-hub.com',
];
const CANONICAL_WEB_PATHS = ['/', '/masters'];
const WEB_ALIASES = [
  {
    source: 'https://diplomas.finki-hub.com',
    target: 'https://theses.finki-hub.com',
  },
  {
    source: 'https://masters.finki-hub.com',
    target: 'https://theses.finki-hub.com',
  },
  {
    source: 'https://diplomski.finki-hub.com',
    target: 'https://trudovi.finki-hub.com',
  },
  {
    source: 'https://magisterski.finki-hub.com',
    target: 'https://trudovi.finki-hub.com',
  },
];
const API_CATALOGS = [
  {
    host: 'https://bachelors-api.finki-hub.com',
    path: '/diplomas',
    label: 'bachelors API catalog',
  },
  {
    host: 'https://masters-api.finki-hub.com',
    path: '/masters',
    label: 'masters API catalog',
  },
];
const LEGACY_API_HOSTS = [
  'diplomas-api.finki-hub.com',
  'diplomski-api.finki-hub.com',
  'magisterski-api.finki-hub.com',
];
const REQUIRED_API_HOSTS = [
  'bachelors-api.finki-hub.com',
  'masters-api.finki-hub.com',
];

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const retryCheck = async (label, check, options) => {
  let lastError;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await check();
    } catch (error) {
      lastError = error;
      if (attempt < options.attempts) await options.sleep(options.retryDelayMs);
    }
  }

  throw new Error(
    `${label} did not verify after ${String(options.attempts)} attempts`,
    { cause: lastError },
  );
};

const requireOk = (label, response) => {
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${String(response.status)}`);
  }
};

const readAttribute = (attributes, name) => {
  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'iu'),
  );
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
};

const findSameOriginModule = (html, pageUrl) => {
  for (const match of html.matchAll(/<script\b([^>]*)>/giu)) {
    const attributes = match[1] ?? '';
    if (readAttribute(attributes, 'type')?.toLowerCase() !== 'module') continue;

    const source = readAttribute(attributes, 'src');
    if (!source) continue;

    const assetUrl = new URL(source, pageUrl);
    if (assetUrl.origin !== new URL(pageUrl).origin) {
      throw new Error('main JavaScript asset is not same-origin');
    }

    return assetUrl.href;
  }

  throw new Error('module JavaScript asset is missing');
};

/**
 * Verify that the Pages release and currently live canonical APIs are ready
 * before the workflow proceeds to deploy API host redirects.
 *
 * @param {{ attempts?: number, fetchImpl?: typeof fetch, retryDelayMs?: number, sleep?: (milliseconds: number) => Promise<void>, timeoutMs?: number }} [options]
 */
export const verifyCanonicalDeployment = async (options = {}) => {
  const config = {
    attempts: options.attempts ?? 5,
    fetchImpl: options.fetchImpl ?? fetch,
    retryDelayMs: options.retryDelayMs ?? 1_000,
    sleep: options.sleep ?? delay,
    timeoutMs: options.timeoutMs ?? 5_000,
  };

  if (!Number.isInteger(config.attempts) || config.attempts < 1) {
    throw new Error('attempts must be a positive integer');
  }

  const checkRequest = (label, url, init, validate) =>
    retryCheck(
      label,
      async () => {
        const response = await config.fetchImpl(url, {
          ...init,
          signal: AbortSignal.timeout(config.timeoutMs),
        });
        return validate(response);
      },
      config,
    );

  const pageChecks = CANONICAL_WEB_HOSTS.flatMap((host) =>
    CANONICAL_WEB_PATHS.map((path) => {
      const pageUrl = new URL(path, host).href;
      const label = `canonical page ${new URL(host).hostname}${path}`;

      return checkRequest(
        label,
        pageUrl,
        { method: 'GET', redirect: 'manual' },
        async (response) => {
          requireOk(label, response);
          if (!response.headers.get('content-type')?.includes('text/html')) {
            throw new Error(`${label} did not return HTML`);
          }

          const html = await response.text();
          if (!/<html\b/iu.test(html)) throw new Error(`${label} HTML is invalid`);

          return findSameOriginModule(html, pageUrl);
        },
      );
    }),
  );

  const aliasChecks = WEB_ALIASES.map(({ source, target }) => {
    const requestUrl = new URL(
      '/__canonical-deployment-check/%E2%9C%93?path=%2F&plus=a+b',
      source,
    );
    const targetUrl = new URL(
      `${requestUrl.pathname}${requestUrl.search}`,
      target,
    ).href;
    const label = `web alias ${new URL(source).hostname}`;

    return () => checkRequest(
      label,
      requestUrl.href,
      { method: 'GET', redirect: 'manual' },
      (response) => {
        if (response.status !== 301) {
          throw new Error(`${label} returned HTTP ${String(response.status)}`);
        }
        if (response.headers.get('location') !== targetUrl) {
          throw new Error(`${label} returned an unexpected Location`);
        }
      },
    );
  });

  const apiChecks = API_CATALOGS.map(({ host, label, path }) => {
    const url = new URL(path, host).href;

    return () => checkRequest(
      label,
      url,
      {
        headers: { Origin: 'https://theses.finki-hub.com' },
        method: 'GET',
        redirect: 'manual',
      },
      async (response) => {
        requireOk(label, response);
        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error(`${label} did not return JSON`);
        }
        const allowOrigin = response.headers.get('access-control-allow-origin');
        if (allowOrigin !== '*' && allowOrigin !== 'https://theses.finki-hub.com') {
          throw new Error(`${label} did not allow the canonical site origin`);
        }

        let payload;
        try {
          payload = await response.json();
        } catch {
          throw new Error(`${label} returned invalid JSON`);
        }
        if (!Array.isArray(payload)) throw new Error(`${label} JSON was not a catalog array`);
      },
    );
  });

  const moduleUrls = await Promise.all(pageChecks);
  const uniqueModuleUrls = [...new Set(moduleUrls)];
  const assetChecks = uniqueModuleUrls.map((url) =>
    checkRequest(
      `frontend module for ${new URL(url).hostname}`,
      url,
      { method: 'GET', redirect: 'manual' },
      async (response) => {
        requireOk('frontend module asset', response);
        const contentType = response.headers.get('content-type') ?? '';
        if (!/javascript|ecmascript/iu.test(contentType)) {
          throw new Error('frontend module asset did not return JavaScript');
        }

        const source = await response.text();
        for (const apiHost of REQUIRED_API_HOSTS) {
          if (!source.includes(apiHost)) {
            throw new Error('frontend module is missing a canonical API host');
          }
        }
        for (const legacyHost of LEGACY_API_HOSTS) {
          if (source.includes(legacyHost)) {
            throw new Error('frontend module still contains a legacy API host');
          }
        }
      },
    ),
  );

  await Promise.all([
    ...aliasChecks.map((check) => check()),
    ...apiChecks.map((check) => check()),
    ...assetChecks,
  ]);

  return {
    aliases: WEB_ALIASES.length,
    apiCatalogs: API_CATALOGS.length,
    pages: CANONICAL_WEB_HOSTS.length * CANONICAL_WEB_PATHS.length,
    moduleAssets: uniqueModuleUrls.length,
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyCanonicalDeployment()
    .then(({ aliases, apiCatalogs, moduleAssets, pages }) => {
      console.log(
        `Canonical deployment verified: ${pages} pages, ${moduleAssets} JS assets, ${apiCatalogs} APIs, ${aliases} aliases.`,
      );
    })
    .catch((error) => {
      console.error(`Canonical deployment verification failed: ${error.message}`);
      process.exitCode = 1;
    });
}
