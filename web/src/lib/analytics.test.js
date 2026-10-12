/* eslint-disable camelcase -- Assert the serialized PostHog protocol. */
import { afterEach, expect, it, vi } from 'vitest';

import {
  assertAllowlistedAnalytics,
  assertAnalyticsOptOut,
  captureAnalyticsCases,
  createMaliciousProperties,
  decodeAnalyticsRequests,
  stubAnalyticsEnvironment,
} from './analytics.test-helpers.js';

vi.mock('./build-revision.generated', () => ({
  BUILD_REVISION: 'a'.repeat(40),
}));

const SENTINEL = 'Private Student Thesis Advisor 123456';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('sends only the allowlist through real SDK compression/transport, respecting opt-out', async () => {
  const requests = [];
  const location = stubAnalyticsEnvironment(requests);
  const { captureAnalytics, initAnalytics } = await import('./analytics');
  const { posthog } = await import('posthog-js');
  const captureWire = (event, properties) =>
    posthog.capture(event, properties, {
      _noTruncate: true,
      send_instantly: true,
    });

  initAnalytics();
  expect(requests).toHaveLength(0);
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_fake_test_key');
  initAnalytics();
  const malicious = createMaliciousProperties(location);
  const expected = captureAnalyticsCases({ captureWire, malicious, posthog });

  await vi.advanceTimersByTimeAsync(4_000);
  const decoded = decodeAnalyticsRequests(requests);
  assertAllowlistedAnalytics({ ...expected, events: decoded });
  await assertAnalyticsOptOut({
    captureAnalytics,
    initAnalytics,
    malicious,
    posthog,
    requests,
  });
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_fake_test_key');
  vi.spyOn(posthog, 'capture').mockImplementation(() => {
    throw new Error(SENTINEL);
  });
  expect(() => captureAnalytics('service_visit', {})).not.toThrow();
});
