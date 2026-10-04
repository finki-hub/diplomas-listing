/* eslint-disable camelcase -- PostHog wire contract. */
import { type CaptureResult, posthog } from 'posthog-js';

import { BUILD_REVISION } from './build-revision.generated';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u;
const REVISION = /^[a-f0-9]{40}$/u;
const EVENTS = new Set([
  'catalog_search',
  'result_clicked',
  'search_zero_results',
  'service_visit',
]);
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const eventDimensions = (
  event: string,
  input: Record<string, unknown>,
): null | Record<string, unknown> => {
  if (event === 'service_visit') return {};
  if (input['section'] !== 'diplomas' && input['section'] !== 'masters')
    return null;
  const properties: Record<string, unknown> = { section: input['section'] };
  const attempt = input['search_attempt_id'];
  if (typeof attempt === 'string' && UUID.test(attempt))
    properties['search_attempt_id'] = attempt;
  if (event === 'result_clicked') {
    if (!isCount(input['position'])) return null;
    properties['position'] = input['position'];
  } else {
    if (event === 'search_zero_results' && input['result_count'] !== 0)
      return null;
    if (
      !isCount(input['result_count']) ||
      properties['search_attempt_id'] === undefined
    )
      return null;
    properties['result_count'] = input['result_count'];
  }
  return properties;
};

// Reconstruct both envelope and properties: SDK defaults include URLs and referrers.
export const sanitizeAnalytics = (
  event: CaptureResult | null,
): CaptureResult | null => {
  if (!event || !EVENTS.has(event.event) || !UUID.test(event.uuid)) return null;
  const input = event.properties;
  const dimensions = eventDimensions(event.event, input);
  if (!dimensions) return null;
  const properties: Record<string, unknown> = {
    ...dimensions,
    $process_person_profile: false,
    analytics_schema_version: 2,
    service: 'diplomas-listing',
    token: import.meta.env.VITE_POSTHOG_KEY?.trim(),
  };
  if (BUILD_REVISION?.length === 40 && REVISION.test(BUILD_REVISION))
    properties['build_revision'] = BUILD_REVISION;
  for (const key of [
    'distinct_id',
    '$device_id',
    '$session_id',
    '$window_id',
  ]) {
    const value: unknown = input[key];
    if (typeof value === 'string' && UUID.test(value)) properties[key] = value;
  }
  return {
    event: event.event,
    properties,
    timestamp:
      event.timestamp instanceof Date &&
      Number.isFinite(event.timestamp.getTime())
        ? // eslint-disable-next-line unicorn/prefer-temporal -- PostHog requires a Date timestamp.
          new Date(event.timestamp)
        : undefined,
    uuid: event.uuid,
  };
};

export const initAnalytics = () => {
  const key = import.meta.env.VITE_POSTHOG_KEY?.trim();
  if (!key) return;
  posthog.init(key, {
    advanced_disable_feature_flags: true,
    advanced_disable_flags: true,
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    autocapture: false,
    before_send: sanitizeAnalytics,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_pageleave: false,
    capture_pageview: false,
    capture_performance: false,
    debug: false,
    disable_conversations: true,
    disable_external_dependency_loading: true,
    disable_product_tours: true,
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    logs: { beforeSend: () => null, captureConsoleLogs: false },
    metrics: { beforeSend: () => null, network: false },
    persistence: 'memory',
    person_profiles: 'never',
    respect_dnt: true,
    save_campaign_params: false,
    save_referrer: false,
  });
  posthog.capture('service_visit');
};

export const captureAnalytics = (
  event: string,
  properties: Record<string, unknown>,
) => {
  if (!import.meta.env.VITE_POSTHOG_KEY?.trim()) return;
  posthog.capture(event, properties);
};
