/* eslint-disable camelcase -- PostHog wire contract. */
import { BUILD_REVISION } from './build-revision.generated.js';

const REVISION = /^[a-f0-9]{40}$/u;
const OUTCOMES = new Set(['client_error', 'ok', 'server_error']);

const ROUTES = new Set([
  '/diplomas',
  '/diplomas/download/:id',
  '/masters',
  '/masters/download/:id',
]);
const METHODS = new Set([
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
]);
const EVENTS = new Set([
  'catalog_query',
  'query_zero_results',
  'request_completed',
  'request_failed',
]);

export const telemetryMetadata = () => ({
  analytics_schema_version: 2,
  ...(BUILD_REVISION?.length === 40 &&
    REVISION.test(BUILD_REVISION) && {
      build_revision: BUILD_REVISION,
    }),
});

export const safeRoute = (route: unknown): string =>
  typeof route === 'string' && ROUTES.has(route) ? route : 'unmatched';

export const matchTelemetryRoute = (
  path: string,
  routes: readonly string[],
): string =>
  safeRoute(
    routes.find((route) => {
      if (!route.endsWith('/:id')) return path === route;
      const prefix = route.slice(0, -3);
      const parameter = path.slice(prefix.length);
      return (
        path.startsWith(prefix) &&
        parameter.length > 0 &&
        !parameter.includes('/')
      );
    }),
  );

export const safeMethod = (method: string): string =>
  METHODS.has(method) ? method : 'OTHER';

export const sanitizeProperties = (
  event: string,
  input: Record<string, unknown>,
): null | Record<string, unknown> => {
  if (!EVENTS.has(event)) return null;
  const properties: Record<string, unknown> = {
    ...telemetryMetadata(),
    $process_person_profile: false,
    route: safeRoute(input.route),
  };
  const numericFields =
    event === 'request_completed'
      ? ['duration_ms', 'status']
      : ['result_count'];
  for (const key of numericFields) {
    const value = input[key];
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
      properties[key] = value;
  }
  if (event === 'request_completed') {
    properties.method = safeMethod(
      typeof input.method === 'string' ? input.method : 'OTHER',
    );
    if (typeof input.outcome === 'string' && OUTCOMES.has(input.outcome))
      properties.outcome = input.outcome;
  }
  if (
    (event === 'catalog_query' || event === 'query_zero_results') &&
    typeof input.cache_hit === 'boolean'
  )
    properties.cache_hit = input.cache_hit;
  if (event === 'request_failed') properties.category = 'handler_error';
  return properties;
};
