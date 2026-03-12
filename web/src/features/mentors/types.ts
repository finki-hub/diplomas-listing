import type { Diploma, MentorSummary } from '@/types';

export type FilteredMentorSummary = MentorSummary & {
  filteredDiplomas: Diploma[];
};

export type SortDirection = 'asc' | 'desc';

export type SortField = 'mentor' | 'totalDiplomas';
