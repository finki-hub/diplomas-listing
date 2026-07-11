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
  getFileUrl: (fileId: null | string) => null | string;
  getStatusOpacity: (status: string) => number;
};

export type MentorListItemProps = {
  expanded: boolean;
  getBadgeOpacity: (count: number) => number;
  getFileUrl: (fileId: null | string) => null | string;
  getStatusOpacity: (status: string) => number;
  hasActiveFilters: boolean;
  index: number;
  onToggle: () => void;
  summary: FilteredMentorSummary;
};

export type MentorsListProps = {
  expandedMentor: null | string;
  filteredSummaries: FilteredMentorSummary[];
  getBadgeOpacity: (count: number) => number;
  getFileUrl: (fileId: null | string) => null | string;
  getStatusOpacity: (status: string) => number;
  hasActiveFilters: boolean;
  onSort: (field: SortField) => void;
  onToggle: (mentor: string) => void;
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
