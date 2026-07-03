import type { Diploma } from '@/types';

import type {
  FilteredMentorSummary,
  SortDirection,
  SortField,
} from '../../types';

export type DiplomaCountBadgeProps = {
  filteredCount: number;
  hasActiveFilters: boolean;
  opacity: number;
  totalCount: number;
};

export type DiplomaDetailsTableProps = {
  diplomas: Diploma[];
  getStatusOpacity: (status: string) => number;
  showFileColumn: boolean;
};

export type MentorListItemProps = {
  expanded: boolean;
  getBadgeOpacity: (count: number) => number;
  getStatusOpacity: (status: string) => number;
  hasActiveFilters: boolean;
  index: number;
  onToggle: () => void;
  showFileColumn: boolean;
  summary: FilteredMentorSummary;
};

export type MentorsListProps = {
  expandedMentor: null | string;
  filteredSummaries: FilteredMentorSummary[];
  getBadgeOpacity: (count: number) => number;
  getStatusOpacity: (status: string) => number;
  hasActiveFilters: boolean;
  onSort: (field: SortField) => void;
  onToggle: (mentor: string) => void;
  showFileColumn: boolean;
  sortDirection: SortDirection;
  sortField: SortField;
  tableCountHeader: string;
};

export type MentorTableHeaderProps = SortControlsProps & {
  countHeaderLabel: string;
};

export type SortControlsProps = {
  onSort: (field: SortField) => void;
  sortDirection: SortDirection;
  sortField: SortField;
};

export type SortIconProps = {
  currentDirection: SortDirection;
  currentField: SortField;
  field: SortField;
};
