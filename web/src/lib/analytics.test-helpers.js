/* eslint-disable camelcase -- Preserve the serialized telemetry protocol keys. */
import { Buffer } from 'node:buffer';
import { gunzipSync } from 'node:zlib';
import { expect, vi } from 'vitest';

const SENTINEL = 'Private Student Thesis Advisor 123456';
const ATTEMPT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

export const stubAnalyticsEnvironment = (requests) => {
  vi.useFakeTimers();
  vi.stubGlobal('CompressionStream');
  const location = new URL(
    `https://example.test/${encodeURIComponent(SENTINEL)}?q=${encodeURIComponent(SENTINEL)}`,
  );
  const storage = {
    getItem: () => null,
    removeItem: vi.fn(),
    setItem: vi.fn(),
  };
  const document = {
    addEventListener: vi.fn(),
    body: { clientHeight: 100, scrollHeight: 100 },
    cookie: '',
    createElement: () => ({ setAttribute: vi.fn(), style: {} }),
    documentElement: { clientHeight: 100, scrollHeight: 100 },
    getElementById: () => null,
    location,
    querySelectorAll: () => [],
    readyState: 'complete',
    referrer: location.href,
    removeEventListener: vi.fn(),
  };
  const navigator = { onLine: true, userAgent: 'Mozilla/5.0' };
  const window = {
    addEventListener: vi.fn(),
    document,
    innerHeight: 100,
    innerWidth: 100,
    localStorage: storage,
    location,
    navigator,
    removeEventListener: vi.fn(),
    screen: { height: 100, width: 100 },
    sessionStorage: storage,
  };
  vi.stubGlobal('fetch', (url, options) => {
    requests.push({ body: options?.body, url: String(url) });
    return Promise.resolve(Response.json({ status: 1 }));
  });
  const globals = {
    document,
    location,
    navigator,
    window,
  };
  for (const [key, value] of Object.entries(globals)) {
    vi.stubGlobal(key, value);
  }
  vi.stubEnv('VITE_POSTHOG_KEY', '');
  vi.stubEnv('VITE_POSTHOG_HOST', 'https://telemetry.invalid');

  return location;
};

export const createMaliciousProperties = (location) => ({
  $current_url: location.href,
  $exception_list: [{ value: SENTINEL }],
  $ip: '192.0.2.1',
  $set: { name: SENTINEL },
  $set_once: { name: SENTINEL },
  analytics_schema_version: 900,
  build_revision: 'b'.repeat(40),
  nested: { title: SENTINEL },
  outcome: 'fresh',
  position: 0,
  query: SENTINEL,
  result_count: 3,
  result_id: SENTINEL,
  search_attempt_id: ATTEMPT,
  section: 'diplomas',
  service: SENTINEL,
  token: SENTINEL,
  trigger: 'query_edit',
});

export const captureAnalyticsCases = ({ captureWire, malicious, posthog }) => {
  const downloadOutcomes = [
    'browser_handoff',
    'not_found',
    'http_error',
    'invalid_response',
    'client_error',
  ];
  const loadOutcomes = ['fresh', 'stale', 'error'];
  const loadTriggers = ['initial', 'retry'];
  const searchTriggers = [
    'initial',
    'query_edit',
    'filter_change',
    'sort_change',
    'data_refresh',
  ];
  for (const outcome of downloadOutcomes)
    captureWire('document_download_result', { ...malicious, outcome });
  for (const outcome of loadOutcomes) {
    for (const trigger of loadTriggers)
      captureWire('catalog_load_result', {
        ...malicious,
        outcome,
        trigger,
      });
  }
  for (const trigger of searchTriggers)
    captureWire('catalog_search', { ...malicious, trigger });
  for (const event of [
    'catalog_search',
    'search_zero_results',
    'result_clicked',
  ]) {
    posthog.capture(
      event,
      { ...malicious, result_count: event === 'search_zero_results' ? 0 : 3 },
      { send_instantly: true },
    );
  }
  posthog.capture(
    'document_download_result',
    { ...malicious, outcome: 'browser_handoff' },
    { send_instantly: true },
  );
  let coercions = 0;
  const coercible = (approvedValue) => ({
    private_name: SENTINEL,
    toString: () => {
      coercions += 1;
      return approvedValue;
    },
  });
  captureWire('document_download_result', {
    ...malicious,
    outcome: ['browser_handoff'],
  });
  captureWire('document_download_result', {
    ...malicious,
    outcome: coercible('browser_handoff'),
  });
  captureWire('catalog_load_result', {
    ...malicious,
    outcome: ['fresh'],
  });
  captureWire('catalog_load_result', {
    ...malicious,
    outcome: coercible('fresh'),
  });
  captureWire('catalog_load_result', {
    ...malicious,
    trigger: ['retry'],
  });
  captureWire('catalog_load_result', {
    ...malicious,
    trigger: coercible('retry'),
  });
  captureWire('catalog_search', { ...malicious, trigger: ['query_edit'] });
  captureWire('catalog_search', {
    ...malicious,
    trigger: coercible('query_edit'),
  });
  const invalidEnumValues = [7, true, null, undefined];
  for (const value of invalidEnumValues) {
    captureWire('document_download_result', { ...malicious, outcome: value });
    captureWire('catalog_load_result', { ...malicious, outcome: value });
    captureWire('catalog_load_result', { ...malicious, trigger: value });
    captureWire('catalog_search', { ...malicious, trigger: value });
  }
  expect(coercions).toBe(0);
  posthog.capture(
    'catalog_load_result',
    { ...malicious, outcome: 'error', retained_data: true, trigger: 'retry' },
    { send_instantly: true },
  );
  posthog.capture(
    'document_download_result',
    { ...malicious, outcome: SENTINEL },
    { send_instantly: true },
  );
  posthog.capture(
    'catalog_load_result',
    { ...malicious, outcome: 'fresh', trigger: SENTINEL },
    { send_instantly: true },
  );
  for (const event of [
    '$pageview',
    '$autocapture',
    '$exception',
    '$snapshot',
    '$identify',
    SENTINEL,
  ]) {
    posthog.capture(event, malicious, { send_instantly: true });
  }
  posthog.captureException(
    new Error(SENTINEL, { cause: { url: malicious.$current_url } }),
  );
  posthog.capture(
    'catalog_search',
    { ...malicious, result_count: -1 },
    { send_instantly: true },
  );
  posthog.capture(
    'catalog_search',
    { ...malicious, section: SENTINEL },
    { send_instantly: true },
  );
  posthog.capture(
    'catalog_search',
    { ...malicious, search_attempt_id: SENTINEL },
    { send_instantly: true },
  );
  posthog.capture(
    'result_clicked',
    { ...malicious, position: -1 },
    { send_instantly: true },
  );
  posthog.capture(
    'catalog_search',
    { ...malicious, trigger: SENTINEL },
    { send_instantly: true },
  );

  return { downloadOutcomes, loadOutcomes, loadTriggers, searchTriggers };
};

export const decodeAnalyticsRequests = (requests) =>
  requests.map(({ body, url }) => {
    expect(['/e/', '/i/v0/e/']).toContain(new URL(url).pathname);
    if (typeof body === 'string') {
      return body.startsWith('data=')
        ? // eslint-disable-next-line unicorn/prefer-uint8array-base64 -- CI supports default Node LTS without Uint8Array.fromBase64.
          Buffer.from(
            new URLSearchParams(body).get('data'),
            'base64',
          ).toString()
        : body;
    }
    return gunzipSync(Buffer.from(body)).toString();
  });

export const assertAllowlistedAnalytics = ({
  downloadOutcomes,
  events,
  loadOutcomes,
  loadTriggers,
  searchTriggers,
}) => {
  expect(events.length).toBeGreaterThan(0);
  const receivedEvents = events.flatMap((body) => {
    const envelope = JSON.parse(body);
    expect(Object.keys(envelope).sort()).toEqual([
      'api_key',
      'batch',
      'sent_at',
    ]);
    expect(envelope.api_key).toBe('phc_fake_test_key');
    return envelope.batch;
  });
  expect(new Set(receivedEvents.map(({ event }) => event))).toEqual(
    new Set([
      'catalog_load_result',
      'catalog_search',
      'document_download_result',
      'result_clicked',
      'search_zero_results',
      'service_visit',
    ]),
  );
  expect(
    new Set(
      receivedEvents
        .filter(({ event }) => event === 'document_download_result')
        .map(({ properties }) => properties.outcome),
    ),
  ).toEqual(new Set(downloadOutcomes));
  expect(
    new Set(
      receivedEvents
        .filter(({ event }) => event === 'catalog_load_result')
        .map(({ properties }) => properties.outcome),
    ),
  ).toEqual(new Set(loadOutcomes));
  expect(
    new Set(
      receivedEvents
        .filter(({ event }) => event === 'catalog_load_result')
        .map(({ properties }) => properties.trigger),
    ),
  ).toEqual(new Set(loadTriggers));
  expect(
    new Set(
      receivedEvents
        .filter(({ event }) => event === 'catalog_search')
        .map(({ properties }) => properties.trigger),
    ),
  ).toEqual(new Set(searchTriggers));
  expect(JSON.stringify(receivedEvents)).not.toContain(SENTINEL);
  expect(JSON.stringify(receivedEvents)).not.toContain(
    encodeURIComponent(SENTINEL),
  );
  for (const event of receivedEvents) {
    expect(event.properties).toMatchObject({
      $process_person_profile: false,
      analytics_schema_version: 2,
      service: 'theses-listing',
      token: 'phc_fake_test_key',
    });
    expect(event.properties.build_revision).toBe('a'.repeat(40));
    // Payload-only guarantee: the receiver still observes the network IP.
    expect(event.properties).not.toHaveProperty('$ip');
    expect(Object.keys(event).sort()).toEqual([
      'event',
      'properties',
      'timestamp',
      'uuid',
    ]);
    expect(
      Object.keys(event.properties).every((key) =>
        [
          '$device_id',
          '$process_person_profile',
          '$session_id',
          '$window_id',
          'analytics_schema_version',
          'build_revision',
          'distinct_id',
          'outcome',
          'position',
          'result_count',
          'retained_data',
          'search_attempt_id',
          'section',
          'service',
          'token',
          'trigger',
        ].includes(key),
      ),
    ).toBe(true);
  }
  return receivedEvents;
};

export const assertAnalyticsOptOut = async ({
  captureAnalytics,
  initAnalytics,
  malicious,
  posthog,
  requests,
}) => {
  const count = requests.length;
  posthog.opt_out_capturing();
  posthog.capture('catalog_search', malicious, { send_instantly: true });
  await vi.advanceTimersByTimeAsync(4_000);
  expect(requests).toHaveLength(count);
  vi.stubEnv('VITE_POSTHOG_KEY', '');
  initAnalytics();
  captureAnalytics('result_clicked', malicious);
  await vi.advanceTimersByTimeAsync(4_000);
  expect(requests).toHaveLength(count);
};
