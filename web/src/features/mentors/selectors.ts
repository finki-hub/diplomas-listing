import type { Diploma, MentorSummary } from '@/types';

import type { FilteredMentorSummary, SortDirection, SortField } from './types';

import { getStatusStage, getSubmissionYear } from './utils';

type FilterOptions = {
  query: string;
  selectedStatus: string;
  selectedYear: string;
};

const matchesDiploma = (
  diploma: Diploma,
  options: FilterOptions,
  mentorMatches: boolean,
): boolean => {
  const matchesStatus =
    options.selectedStatus.length === 0 ||
    diploma.status === options.selectedStatus;
  const matchesYear =
    options.selectedYear.length === 0 ||
    getSubmissionYear(diploma.dateOfSubmission) === options.selectedYear;
  const matchesSearch =
    options.query.length === 0 ||
    mentorMatches ||
    diploma.title.toLowerCase().includes(options.query) ||
    diploma.student.toLowerCase().includes(options.query) ||
    diploma.status.toLowerCase().includes(options.query);

  return matchesStatus && matchesYear && matchesSearch;
};

type CompareOptions = {
  hasQuery: boolean;
  sortDirection: SortDirection;
  sortField: SortField;
};

const compareSummaries = (
  a: FilteredMentorSummary,
  b: FilteredMentorSummary,
  options: CompareOptions,
): number => {
  let comparison = 0;

  if (options.sortField === 'mentor') {
    comparison = a.mentor.localeCompare(b.mentor);
  } else {
    comparison = options.hasQuery
      ? a.filteredDiplomas.length - b.filteredDiplomas.length
      : a.totalDiplomas - b.totalDiplomas;
  }

  return options.sortDirection === 'asc' ? comparison : -comparison;
};

export const buildFilteredSummaries = (options: {
  query: string;
  selectedStatus: string;
  selectedYear: string;
  sortDirection: SortDirection;
  sortField: SortField;
  summaries: MentorSummary[];
}): FilteredMentorSummary[] => {
  const filterOptions: FilterOptions = {
    query: options.query,
    selectedStatus: options.selectedStatus,
    selectedYear: options.selectedYear,
  };

  const results = options.summaries
    .map((summary) => {
      const mentorMatches =
        options.query.length === 0 ||
        summary.mentor.toLowerCase().includes(options.query);

      const matchingDiplomas = summary.diplomas.filter((diploma) =>
        matchesDiploma(diploma, filterOptions, mentorMatches),
      );

      if (matchingDiplomas.length === 0) return null;

      return { ...summary, filteredDiplomas: matchingDiplomas };
    })
    .filter(
      (summary): summary is NonNullable<typeof summary> => summary !== null,
    );

  return [...results].sort((a, b) =>
    compareSummaries(a, b, {
      hasQuery: options.query.length > 0,
      sortDirection: options.sortDirection,
      sortField: options.sortField,
    }),
  );
};

export const buildStatusOptions = (diplomaData: Diploma[] | undefined) =>
  [...new Set((diplomaData ?? []).map((diploma) => diploma.status))].sort(
    (a, b) => {
      const stageA = getStatusStage(a) ?? Number.MAX_SAFE_INTEGER;
      const stageB = getStatusStage(b) ?? Number.MAX_SAFE_INTEGER;

      if (stageA !== stageB) {
        return stageA - stageB;
      }

      return a.localeCompare(b);
    },
  );

export const buildYearOptions = (diplomaData: Diploma[] | undefined) =>
  [
    ...new Set(
      (diplomaData ?? [])
        .map((diploma) => getSubmissionYear(diploma.dateOfSubmission))
        .filter((year): year is string => year !== null),
    ),
  ].sort((a, b) => Number(b) - Number(a));

export const calculateMedianDiplomas = (summaries: MentorSummary[]) => {
  if (summaries.length === 0) return 0;

  const counts = summaries
    .map((summary) => summary.totalDiplomas)
    .sort((a, b) => a - b);
  const mid = Math.floor(counts.length / 2);

  if (counts.length % 2 === 0) {
    return ((counts[mid - 1] ?? 0) + (counts[mid] ?? 0)) / 2;
  }

  return counts[mid] ?? 0;
};

export const calculateTopMentorsDiplomaCount = (
  summaries: MentorSummary[],
  limit: number,
) =>
  summaries
    .slice(0, limit)
    .reduce((total, summary) => total + summary.totalDiplomas, 0);
