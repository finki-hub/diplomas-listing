/* eslint-disable camelcase -- PostHog event contract. */
import { type Accessor, createEffect, onCleanup } from 'solid-js';

import { captureAnalytics } from './analytics';

type SearchAnalyticsOptions = {
  readonly active: Accessor<boolean>;
  readonly count: Accessor<number>;
  // Local-only comparison key. Never passed to captureAnalytics.
  readonly intent: Accessor<string>;
  readonly ready: Accessor<boolean>;
  readonly section: 'diplomas' | 'masters';
};

export const createSearchAnalytics = (options: SearchAnalyticsOptions) => {
  let settled: undefined | { id: string; intent: string };
  createEffect(() => {
    const intent = options.intent();
    const count = options.count();
    settled = undefined;
    if (!options.active() || !options.ready()) return;
    const timer = setTimeout(() => {
      const id = crypto.randomUUID();
      settled = { id, intent };
      const properties = {
        result_count: count,
        search_attempt_id: id,
        section: options.section,
      };
      captureAnalytics('catalog_search', properties);
      if (count === 0) captureAnalytics('search_zero_results', properties);
    }, 500);
    onCleanup(() => {
      clearTimeout(timer);
      settled = undefined;
    });
  });
  return (position: number) => {
    if (position < 0) return;
    captureAnalytics('result_clicked', {
      position,
      ...(settled?.intent === options.intent() &&
        options.ready() && { search_attempt_id: settled.id }),
      section: options.section,
    });
  };
};
