import { posthog } from 'posthog-js';

const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

export const initAnalytics = () => {
  const key = import.meta.env.VITE_POSTHOG_KEY?.trim();

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
    capture_pageview: 'history_change',
    // eslint-disable-next-line camelcase -- posthog-js option keys are snake_case.
    person_profiles: 'identified_only',
  });
  posthog.register({ service: 'diplomas-listing' });
};
