import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';

import type { SortField } from '../types';

import { fetchDiplomas } from '../api';
import {
  getInitialMentorsPageState,
  syncMentorsSearchParams,
} from '../query-state';
import {
  buildFilteredSummaries,
  buildStatusOptions,
  buildYearOptions,
  calculateMedianDiplomas,
  calculateTopMentorsDiplomaCount,
} from '../selectors';
import { aggregateByMentor } from '../utils';

export const useMentorsPageState = () => {
  const initialState = getInitialMentorsPageState();

  const [lastUpdatedAt, setLastUpdatedAt] = createSignal<null | string>(null);
  const [diplomas] = createResource(async () => {
    const nextDiplomas = await fetchDiplomas();
    setLastUpdatedAt(new Date().toISOString());
    return nextDiplomas;
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
      query: search().toLowerCase().trim(),
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
  const statusOptions = createMemo(() => buildStatusOptions(diplomas()));
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

  const getBadgeOpacity = (count: number) => {
    const min = 0.3;
    const max = 1;

    return min + (count / maxDiplomas()) * (max - min);
  };

  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection(field === 'totalDiplomas' ? 'desc' : 'asc');
  };

  const toggleExpanded = (mentor: string) => {
    setExpandedMentor((previous) => (previous === mentor ? null : mentor));
  };

  return {
    diplomas,
    expandedMentor,
    filteredDiplomasCount,
    filteredSummaries,
    getBadgeOpacity,
    handleSort,
    hasActiveFilters,
    lastUpdatedAt,
    medianDiplomas,
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
