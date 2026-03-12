import { createMemo, createResource, createSignal } from 'solid-js';

import type { FilteredMentorSummary, SortDirection, SortField } from '../types';

import { fetchDiplomas } from '../api';
import { aggregateByMentor } from '../utils';

export const useMentorsPageState = () => {
  const [diplomas] = createResource(fetchDiplomas);
  const [search, setSearch] = createSignal('');
  const [sortField, setSortField] = createSignal<SortField>('totalDiplomas');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('desc');
  const [expandedMentor, setExpandedMentor] = createSignal<null | string>(null);

  const mentorSummaries = createMemo(() => {
    const data = diplomas();
    if (!data) return [];

    return aggregateByMentor(data);
  });

  const filteredSummaries = createMemo((): FilteredMentorSummary[] => {
    const query = search().toLowerCase().trim();

    const results: FilteredMentorSummary[] = query
      ? mentorSummaries()
          .map((summary) => {
            const mentorMatches = summary.mentor.toLowerCase().includes(query);
            const matchingDiplomas = summary.diplomas.filter(
              (diploma) =>
                diploma.title.toLowerCase().includes(query) ||
                diploma.student.toLowerCase().includes(query),
            );

            if (mentorMatches || matchingDiplomas.length > 0) {
              return {
                ...summary,
                filteredDiplomas: mentorMatches
                  ? summary.diplomas
                  : matchingDiplomas,
              };
            }

            return null;
          })
          .filter(
            (summary): summary is NonNullable<typeof summary> =>
              summary !== null,
          )
      : mentorSummaries().map((summary) => ({
          ...summary,
          filteredDiplomas: summary.diplomas,
        }));

    const currentSortField = sortField();
    const currentSortDirection = sortDirection();

    return [...results].sort((a, b) => {
      let comparison = 0;

      if (currentSortField === 'mentor') {
        comparison = a.mentor.localeCompare(b.mentor);
      } else {
        comparison = query
          ? a.filteredDiplomas.length - b.filteredDiplomas.length
          : a.totalDiplomas - b.totalDiplomas;
      }

      return currentSortDirection === 'asc' ? comparison : -comparison;
    });
  });

  const totalDiplomasCount = createMemo(() => diplomas()?.length ?? 0);
  const totalMentorsCount = createMemo(() => mentorSummaries().length);

  const maxDiplomas = createMemo(() => {
    const summaries = mentorSummaries();
    if (summaries.length === 0) return 1;

    return Math.max(...summaries.map((summary) => summary.totalDiplomas));
  });

  const getBadgeOpacity = (count: number) => {
    const min = 0.3;
    const max = 1;

    return min + (count / maxDiplomas()) * (max - min);
  };

  const medianDiplomas = createMemo((): number => {
    const summaries = mentorSummaries();
    if (summaries.length === 0) return 0;

    const counts = summaries
      .map((summary) => summary.totalDiplomas)
      .sort((a, b) => a - b);
    const mid = Math.floor(counts.length / 2);

    if (counts.length % 2 === 0) {
      return ((counts[mid - 1] ?? 0) + (counts[mid] ?? 0)) / 2;
    }

    return counts[mid] ?? 0;
  });

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
    filteredSummaries,
    getBadgeOpacity,
    handleSort,
    medianDiplomas,
    search,
    setSearch,
    sortDirection,
    sortField,
    toggleExpanded,
    totalDiplomasCount,
    totalMentorsCount,
  };
};
