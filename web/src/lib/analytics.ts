import { posthog } from 'posthog-js';

// Public, write-only browser ingest key. Safe to commit and ship in the bundle,
// mirroring the API's wrangler.toml [vars]. Override locally via VITE_POSTHOG_*.
const DEFAULT_POSTHOG_KEY = 'phc_xXEqLMnYeDPuXA6HHwuasQMdSufDGryS8vZZuHmu9Qwd';
const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

export const initAnalytics = () => {
  const key = import.meta.env.VITE_POSTHOG_KEY ?? DEFAULT_POSTHOG_KEY;

  if (!key) {
    return;
  }

  posthog.init(key, {
    // eslint-disable-next-line camelcase -- posthog-js option keys are snake_case.
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST,
    autocapture: true,
    // eslint-disable-next-line camelcase -- posthog-js option keys are snake_case.
    capture_exceptions: true,
    // eslint-disable-next-line camelcase -- posthog-js option keys are snake_case.
    person_profiles: 'identified_only',
  });
};
