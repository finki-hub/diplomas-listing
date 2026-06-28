import { posthog } from 'posthog-js';

const DEFAULT_POSTHOG_KEY = 'phc_xXEqLMnYeDPuXA6HHwuasQMdSufDGryS8vZZuHmu9Qwd';
const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

export const initAnalytics = () => {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY ?? DEFAULT_POSTHOG_KEY, {
    // eslint-disable-next-line camelcase -- posthog-js option keys are snake_case.
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST,
    autocapture: true,
    // eslint-disable-next-line camelcase -- posthog-js option keys are snake_case.
    capture_exceptions: true,
    // eslint-disable-next-line camelcase -- posthog-js option keys are snake_case.
    person_profiles: 'identified_only',
  });
};
