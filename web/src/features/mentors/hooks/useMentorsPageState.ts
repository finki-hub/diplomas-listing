/* eslint-disable camelcase -- PostHog wire contract. */
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  type Setter,
} from 'solid-js';

import type { Diploma } from '@/types';

import { captureAnalytics } from '@/lib/analytics';
import { createSearchAnalytics } from '@/lib/search-analytics';

import type { CatalogResult } from '../api';
import type { SortField } from '../types';

import {
  getInitialMentorsPageState,
  syncMentorsSearchParams,
} from '../query-state';
import {
  getStatusOpacity as getSectionStatusOpacity,
  type SectionConfig,
} from '../section';
import {
  buildFilteredSummaries,
  buildStatusOptions,
  buildYearOptions,
  calculateMedianDiplomas,
  calculateTopMentorsDiplomaCount,
} from '../selectors';
import { aggregateByMentor } from '../utils';

type ThesesResourceOptions = {
  readonly config: SectionConfig;
  readonly setIsStale: Setter<boolean>;
  readonly setLastUpdatedAt: Setter<null | string>;
  readonly setLoadError: Setter<Error | null>;
};

const getLastUpdatedAt = (result: CatalogResult): null | string => {
  if (result.updatedAt !== null || result.stale) return result.updatedAt;

  // eslint-disable-next-line unicorn/prefer-temporal -- Temporal is not yet available in the target browsers and the project ships no polyfill.
  return new Date().toISOString();
};

const createThesesResource = (options: ThesesResourceOptions) => {
  let generation = 0;
  let requestNumber = 0;
  let nextIsRetry = false;
  let disposed = false;
  onCleanup(() => {
    disposed = true;
    generation += 1;
  });
  const [resource, actions] = createResource<Diploma[]>(
    // Resource settlement retains existing fallback/error behavior and reports only terminal states.
    // eslint-disable-next-line sonarjs/cognitive-complexity -- The fetcher must preserve its business error path.
    async (_source, info) => {
      generation += 1;
      const currentGeneration = generation;
      requestNumber += 1;
      const requestNumberAtStart = requestNumber;
      const trigger = nextIsRetry ? 'retry' : 'initial';
      nextIsRetry = false;
      options.setLoadError(null);

      try {
        const result = await options.config.fetchTheses();
        if (!disposed && currentGeneration === generation) {
          captureAnalytics('catalog_load_result', {
            outcome: result.stale ? 'stale' : 'fresh',
            section: options.config.id,
            trigger: requestNumberAtStart === 1 ? 'initial' : trigger,
          });
        }
        options.setIsStale(result.stale);
        options.setLastUpdatedAt(getLastUpdatedAt(result));
        return result.items;
      } catch (error) {
        if (!disposed && currentGeneration === generation) {
          captureAnalytics('catalog_load_result', {
            outcome: 'error',
            retained_data: info.value !== undefined,
            section: options.config.id,
            trigger: requestNumberAtStart === 1 ? 'initial' : trigger,
          });
        }
        options.setLoadError(
          error instanceof Error
            ? error
            : new Error('Catalog request failed', { cause: error }),
        );

        return info.value ?? [];
      }
    },
  );
  const refetch = (...args: Parameters<typeof actions.refetch>) => {
    nextIsRetry = true;
    return actions.refetch(...args);
  };
  return [resource, { ...actions, refetch }] as const;
};

export const useMentorsPageState = (config: SectionConfig) => {
  const initialState = getInitialMentorsPageState();
  const [isStale, setIsStale] = createSignal(false);
  const [lastUpdatedAt, setLastUpdatedAt] = createSignal<null | string>(null);
  const [loadError, setLoadError] = createSignal<Error | null>(null);
  const [diplomas, { refetch: refetchDiplomas }] = createThesesResource({
    config,
    setIsStale,
    setLastUpdatedAt,
    setLoadError,
  });
  const [search, setSearch] = createSignal(initialState.search);
  const [statusFilter, setStatusFilter] = createSignal(
    initialState.statusFilter,
  );
  const [yearFilter, setYearFilter] = createSignal(initialState.yearFilter);
  const [sortField, setSortField] = createSignal(initialState.sortField);
  const [sortDirection, setSortDirection] = createSignal(
    initialState.sortDirection,
  );
  const [expandedMentor, setExpandedMentor] = createSignal(
    initialState.expandedMentor,
  );
  const mentorSummaries = createMemo(() => {
    const data = diplomas();
    if (!data) return [];

    return aggregateByMentor(data);
  });
  const filteredSummaries = createMemo(() =>
    buildFilteredSummaries({
      query: search(),
      selectedStatus: statusFilter(),
      selectedYear: yearFilter(),
      sortDirection: sortDirection(),
      sortField: sortField(),
      summaries: mentorSummaries(),
    }),
  );
  const totalDiplomasCount = createMemo(() => diplomas()?.length ?? 0);
  const totalMentorsCount = createMemo(() => mentorSummaries().length);
  const filteredDiplomasCount = createMemo(() =>
    filteredSummaries().reduce(
      (total, summary) => total + summary.filteredDiplomas.length,
      0,
    ),
  );
  const statusOptions = createMemo(() =>
    buildStatusOptions(diplomas(), config.getStatusStage),
  );
  const yearOptions = createMemo(() => buildYearOptions(diplomas()));
  const medianDiplomas = createMemo(() =>
    calculateMedianDiplomas(mentorSummaries()),
  );
  const topTenDiplomasCount = createMemo(() =>
    calculateTopMentorsDiplomaCount(mentorSummaries(), 10),
  );
  const topTenMentorsShare = createMemo(() => {
    const totalDiplomas = totalDiplomasCount();
    if (totalDiplomas === 0) return 0;

    return (topTenDiplomasCount() / totalDiplomas) * 100;
  });
  const hasActiveFilters = createMemo(
    () =>
      search().trim().length > 0 ||
      statusFilter().length > 0 ||
      yearFilter().length > 0,
  );
  const maxDiplomas = createMemo(() => {
    const summaries = mentorSummaries();
    if (summaries.length === 0) return 1;

    return Math.max(...summaries.map((summary) => summary.totalDiplomas));
  });

  createEffect(() => {
    const currentExpandedMentor = expandedMentor();
    if (!currentExpandedMentor) return;

    // Don't collapse the expanded mentor before data has loaded,
    // otherwise URL params get wiped on initial page load.
    if (diplomas.loading || loadError() !== null) return;

    const mentorStillVisible = filteredSummaries().some(
      (summary) => summary.mentor === currentExpandedMentor,
    );

    if (!mentorStillVisible) {
      setExpandedMentor(null);
    }
  });

  createEffect(() => {
    syncMentorsSearchParams({
      expandedMentor: expandedMentor(),
      search: search(),
      sortDirection: sortDirection(),
      sortField: sortField(),
      statusFilter: statusFilter(),
      yearFilter: yearFilter(),
    });
  });

  // This local-only key invalidates linkage synchronously, even before effects run.
  const searchIntent = () => ({
    filters: JSON.stringify([statusFilter(), yearFilter()]),
    query: search(),
    sort: JSON.stringify([sortField(), sortDirection()]),
  });
  const searchAnalytics = createSearchAnalytics({
    active: () => search().trim().length > 0,
    count: () => filteredSummaries().length,
    intent: searchIntent,
    ready: () => !diplomas.loading && loadError() === null,
    section: config.id,
  });

  const getBadgeOpacity = (count: number) => {
    const min = 0.3;
    const max = 1;

    return min + (count / maxDiplomas()) * (max - min);
  };

  const getStatusOpacity = (status: string) =>
    getSectionStatusOpacity(config, status);

  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection(field === 'totalDiplomas' ? 'desc' : 'asc');
  };

  const toggleExpanded = (mentor: string) => {
    const isOpening = expandedMentor() !== mentor;

    if (isOpening) {
      const position = filteredSummaries().findIndex(
        (summary) => summary.mentor === mentor,
      );
      searchAnalytics.captureResultClick(position);
    }

    setExpandedMentor((previous) => (previous === mentor ? null : mentor));
  };

  return {
    diplomas,
    expandedMentor,
    filteredDiplomasCount,
    filteredSummaries,
    getBadgeOpacity,
    getSearchAttemptId: searchAnalytics.getSearchAttemptId,
    getStatusOpacity,
    handleSort,
    hasActiveFilters,
    isStale,
    lastUpdatedAt,
    loadError,
    medianDiplomas,
    refetchDiplomas,
    search,
    setSearch,
    setStatusFilter,
    setYearFilter,
    sortDirection,
    sortField,
    statusFilter,
    statusOptions,
    toggleExpanded,
    topTenDiplomasCount,
    topTenMentorsShare,
    totalDiplomasCount,
    totalMentorsCount,
    yearFilter,
    yearOptions,
  };
};
