import { posthog } from 'posthog-js';
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  type Setter,
  untrack,
} from 'solid-js';

import type { Diploma } from '@/types';

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
  readonly setLastUpdatedAt: Setter<null | string>;
  readonly setLoadError: Setter<Error | null>;
};

const createThesesResource = (options: ThesesResourceOptions) =>
  createResource<Diploma[]>(async (_source, info) => {
    options.setLoadError(null);

    try {
      const nextDiplomas = await options.config.fetchTheses();
      // eslint-disable-next-line unicorn/prefer-temporal -- Temporal is not yet available in the target browsers and the project ships no polyfill.
      options.setLastUpdatedAt(new Date().toISOString());
      return nextDiplomas;
    } catch (error) {
      options.setLoadError(
        error instanceof Error
          ? error
          : new Error('Catalog request failed', { cause: error }),
      );

      return info.value ?? [];
    }
  });

export const useMentorsPageState = (config: SectionConfig) => {
  const initialState = getInitialMentorsPageState();
  const [lastUpdatedAt, setLastUpdatedAt] = createSignal<null | string>(null);
  const [loadError, setLoadError] = createSignal<Error | null>(null);
  const [diplomas, { refetch: refetchDiplomas }] = createThesesResource({
    config,
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
    if (diplomas.loading) return;

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

  createEffect(() => {
    const q = search();

    if (q.trim().length === 0) return;

    const count = untrack(() => filteredSummaries().length);

    const timer = setTimeout(() => {
      posthog.capture('catalog_search', {
        query: q,
        // eslint-disable-next-line camelcase -- PostHog property names are snake_case.
        result_count: count,
        section: config.id,
      });
      if (count === 0) {
        posthog.capture('search_zero_results', {
          query: q,
          section: config.id,
        });
      }
    }, 500);

    onCleanup(() => {
      clearTimeout(timer);
    });
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
      posthog.capture('result_clicked', {
        position,
        // eslint-disable-next-line camelcase -- PostHog property names are snake_case.
        result_id: mentor,
        section: config.id,
      });
    }

    setExpandedMentor((previous) => (previous === mentor ? null : mentor));
  };

  return {
    diplomas,
    expandedMentor,
    filteredDiplomasCount,
    filteredSummaries,
    getBadgeOpacity,
    getStatusOpacity,
    handleSort,
    hasActiveFilters,
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
