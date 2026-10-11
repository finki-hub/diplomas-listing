import assert from 'node:assert/strict';
import { test } from 'node:test';

import { verifyCanonicalDeployment } from './verify-canonical-deployment.mjs';

const aliases = new Map([
  ['diplomas.finki-hub.com', 'theses.finki-hub.com'],
  ['masters.finki-hub.com', 'theses.finki-hub.com'],
  ['diplomski.finki-hub.com', 'trudovi.finki-hub.com'],
  ['magisterski.finki-hub.com', 'trudovi.finki-hub.com'],
]);

const canonicalAsset = [
  'https://bachelors-api.finki-hub.com/diplomas',
  'https://masters-api.finki-hub.com/masters',
].join('\n');

const createFetch = ({
  aliasRedirect,
  aliasStatus = 301,
  apiStatus = 200,
  assetBody = canonicalAsset,
  allStatus = 200,
} = {}) => {
  const requests = [];
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(input);
    requests.push({ init, url });

    if (allStatus !== 200) return new Response('', { status: allStatus });

    const aliasTarget = aliases.get(url.hostname);
    if (aliasTarget) {
      if (init.redirect !== 'manual') {
        throw new Error('alias check did not request a manual redirect');
      }
      const location =
        aliasRedirect?.(url, aliasTarget) ??
        new URL(`${url.pathname}${url.search}`, `https://${aliasTarget}`).href;
      return new Response(null, { headers: { Location: location }, status: aliasStatus });
    }

    if (url.hostname.endsWith('-api.finki-hub.com')) {
      if (apiStatus !== 200) return new Response('', { status: apiStatus });
      return Response.json([{ title: 'catalog fixture' }], {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (url.pathname.startsWith('/assets/')) {
      return new Response(assetBody, {
        headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
      });
    }

    return new Response(
      '<!doctype html><html><head><script type="module" src="/assets/main.js"></script></head></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  };

  return { fetchImpl, requests };
};

const fastOptions = {
  attempts: 1,
  retryDelayMs: 0,
  sleep: async () => {},
  timeoutMs: 10,
};

test('verifies both canonical sites, API catalogs, bundles, and web aliases', async () => {
  const { fetchImpl, requests } = createFetch();

  const result = await verifyCanonicalDeployment({ ...fastOptions, fetchImpl });

  assert.deepEqual(result, {
    aliases: 4,
    apiCatalogs: 2,
    moduleAssets: 2,
    pages: 4,
  });
  assert.equal(
    requests.filter(({ url }) => url.pathname === '/__canonical-deployment-check/%E2%9C%93').length,
    4,
  );
  assert.equal(
    requests.filter(({ init, url }) =>
      url.hostname.endsWith('-api.finki-hub.com') &&
      init.headers?.Origin === 'https://theses.finki-hub.com',
    ).length,
    2,
  );
});

test('fails when the deployed module lacks canonical API host strings', async () => {
  const { fetchImpl } = createFetch({
    assetBody: 'https://bachelors-api.finki-hub.com only',
  });

  await assert.rejects(
    verifyCanonicalDeployment({ ...fastOptions, fetchImpl }),
    /frontend module for .* did not verify after 1 attempts/u,
  );
});

test('fails when the deployed module still contains a legacy API host', async () => {
  const { fetchImpl } = createFetch({
    assetBody: `${canonicalAsset}\nhttps://diplomski-api.finki-hub.com/diplomas`,
  });

  await assert.rejects(
    verifyCanonicalDeployment({ ...fastOptions, fetchImpl }),
    /frontend module for .* did not verify after 1 attempts/u,
  );
});

test('fails when a web alias has the wrong status or destination', async () => {
  const { fetchImpl } = createFetch({
    aliasRedirect: (url, target) =>
      new URL(`${url.pathname}${url.search}`, `https://${target}`).href.replace(
        'canonical-deployment-check',
        'wrong-destination',
      ),
  });

  await assert.rejects(
    verifyCanonicalDeployment({ ...fastOptions, fetchImpl }),
    /web alias .* did not verify after 1 attempts/u,
  );
});

test('fails when a web alias does not return an exact 301', async () => {
  const { fetchImpl } = createFetch({ aliasStatus: 302 });

  await assert.rejects(
    verifyCanonicalDeployment({ ...fastOptions, fetchImpl }),
    /web alias .* did not verify after 1 attempts/u,
  );
});

test('fails when a canonical API health response is unavailable', async () => {
  const { fetchImpl } = createFetch({ apiStatus: 503 });

  await assert.rejects(
    verifyCanonicalDeployment({ ...fastOptions, fetchImpl }),
    /bachelors API catalog did not verify after 1 attempts/u,
  );
});

test('bounds retries and keeps response data out of failure messages', async () => {
  let calls = 0;
  let sleeps = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response('private response body must not be logged', {
      status: 503,
    });
  };

  await assert.rejects(
    verifyCanonicalDeployment({
      attempts: 3,
      fetchImpl,
      retryDelayMs: 1,
      sleep: async () => {
        sleeps += 1;
      },
      timeoutMs: 10,
    }),
    (error) => {
      assert.match(
        error.message,
        /canonical page theses\.finki-hub\.com\/ did not verify after 3 attempts/u,
      );
      assert.doesNotMatch(error.message, /private response body|student id/u);
      return true;
    },
  );
  assert.equal(calls, 12);
  assert.equal(sleeps, 8);
});
