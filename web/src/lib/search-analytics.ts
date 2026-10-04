/* eslint-disable camelcase -- PostHog event contract. */
import { type Accessor, createEffect, onCleanup } from 'solid-js';

import { captureAnalytics } from './analytics';

export type SearchIntent = {
  readonly filters: string;
  readonly query: string;
  readonly sort: string;
};

type PendingTimer = {
  readonly intent: SearchIntent;
  readonly kind: 'refresh' | 'search';
  readonly timer: ReturnType<typeof setTimeout>;
};

type SearchAnalyticsOptions = {
  readonly active: Accessor<boolean>;
  readonly count: Accessor<number>;
  readonly intent: Accessor<SearchIntent>;
  readonly ready: Accessor<boolean>;
  readonly section: 'diplomas' | 'masters';
};

type SettledSearch = {
  readonly count: number;
  readonly id: string;
  readonly intent: SearchIntent;
};

type Trigger =
  'data_refresh' | 'filter_change' | 'initial' | 'query_edit' | 'sort_change';

const hasSameIntent = (left: SearchIntent, right: SearchIntent) =>
  left.query === right.query &&
  left.filters === right.filters &&
  left.sort === right.sort;

const getTrigger = (
  baseline: SearchIntent,
  intent: SearchIntent,
  dataRefresh: boolean,
): Trigger => {
  if (baseline.query !== intent.query) return 'query_edit';
  if (baseline.filters !== intent.filters) return 'filter_change';
  if (baseline.sort !== intent.sort) return 'sort_change';
  if (dataRefresh) return 'data_refresh';
  return 'initial';
};

export const createSearchAnalytics = (options: SearchAnalyticsOptions) => {
  let settled: SettledSearch | undefined;
  let initialIntent: SearchIntent | undefined;
  let pendingTimer: PendingTimer | undefined;
  let refreshPending = false;
  let wasReady = false;
  let disposed = false;

  const clearTimer = () => {
    if (!pendingTimer) return;
    clearTimeout(pendingTimer.timer);
    pendingTimer = undefined;
  };

  const currentIntent = () => options.intent();
  const baselineIntent = () => settled?.intent ?? initialIntent;
  const needsAttempt = (intent: SearchIntent, count: number) => {
    const baseline = baselineIntent();
    return (
      !settled ||
      refreshPending ||
      settled.count !== count ||
      (baseline !== undefined && !hasSameIntent(baseline, intent))
    );
  };

  const schedule = (intent: SearchIntent, kind: PendingTimer['kind']) => {
    const timer = setTimeout(() => {
      pendingTimer = undefined;
      if (disposed || !options.active() || !options.ready()) return;
      const current = currentIntent();
      const count = options.count();
      if (!needsAttempt(current, count)) return;

      const baseline = baselineIntent() ?? current;
      const trigger = getTrigger(
        baseline,
        current,
        refreshPending || (settled !== undefined && settled.count !== count),
      );
      const id = crypto.randomUUID();
      settled = { count, id, intent: current };
      initialIntent = current;
      refreshPending = false;
      const properties = {
        result_count: count,
        search_attempt_id: id,
        section: options.section,
        trigger,
      };
      captureAnalytics('catalog_search', properties);
      if (count === 0) captureAnalytics('search_zero_results', properties);
    }, 500);
    pendingTimer = { intent, kind, timer };
  };

  const scheduleForIntent = (intent: SearchIntent, count: number) => {
    if (pendingTimer?.kind === 'refresh') {
      if (!hasSameIntent(pendingTimer.intent, intent)) {
        clearTimer();
        schedule(intent, 'refresh');
      }
      return;
    }
    if (
      pendingTimer?.kind === 'search' &&
      hasSameIntent(pendingTimer.intent, intent)
    )
      return;
    clearTimer();
    const kind =
      refreshPending || (settled !== undefined && settled.count !== count)
        ? 'refresh'
        : 'search';
    schedule(intent, kind);
  };

  createEffect(() => {
    const intent = currentIntent();
    const count = options.count();
    const active = options.active();
    const ready = options.ready();
    initialIntent ??= intent;

    if (wasReady && !ready && settled) refreshPending = true;
    wasReady = ready;

    if (!active || !ready) {
      clearTimer();
      return;
    }

    const matchesSettled =
      settled !== undefined &&
      hasSameIntent(settled.intent, intent) &&
      settled.count === count;

    if (!needsAttempt(intent, count)) {
      if (pendingTimer?.kind === 'search') clearTimer();
      // A canceled transient edit restores the last settled UUID immediately.
      if (matchesSettled && !refreshPending && settled)
        settled = { count: settled.count, id: settled.id, intent };
      return;
    }

    scheduleForIntent(intent, count);
  });

  onCleanup(() => {
    disposed = true;
    clearTimer();
    settled = undefined;
  });

  const getSearchAttemptId = () => {
    const intent = currentIntent();
    const count = options.count();
    return settled &&
      !refreshPending &&
      hasSameIntent(settled.intent, intent) &&
      settled.count === count &&
      options.active() &&
      options.ready()
      ? settled.id
      : undefined;
  };

  const captureResultClick = (position: number) => {
    if (position < 0) return;
    const searchAttemptId = getSearchAttemptId();
    captureAnalytics('result_clicked', {
      position,
      ...(searchAttemptId && { search_attempt_id: searchAttemptId }),
      section: options.section,
    });
  };
  return { captureResultClick, getSearchAttemptId };
};
