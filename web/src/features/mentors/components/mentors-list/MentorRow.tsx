import { ChevronRight } from 'lucide-solid';
import { Show } from 'solid-js';

import { TableCell, TableRow } from '@/components/ui/table';

import type { MentorListItemProps } from './types';

import DiplomaCountBadge from './DiplomaCountBadge';
import DiplomaDetailsTable from './DiplomaDetailsTable';

const MentorRow = (props: MentorListItemProps) => (
  <>
    <TableRow
      class="cursor-pointer"
      onClick={props.onToggle}
      onKeyDown={(event) => {
        if (!(event.key === 'Enter' || event.key === ' ')) {
          return;
        }

        event.preventDefault();
        props.onToggle();
      }}
      role="button"
      tabIndex={0}
    >
      <TableCell class="text-center text-muted-foreground">
        {props.index + 1}
      </TableCell>
      <TableCell class="font-medium">
        <div class="flex items-center gap-2">
          <ChevronRight
            class={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              props.expanded ? 'rotate-90' : ''
            }`}
          />
          <span class="truncate">{props.summary.mentor}</span>
        </div>
      </TableCell>
      <TableCell class="text-right">
        <DiplomaCountBadge
          filteredCount={props.summary.filteredDiplomas.length}
          hasActiveFilters={props.hasActiveFilters}
          opacity={props.getBadgeOpacity(props.summary.totalDiplomas)}
          totalCount={props.summary.totalDiplomas}
        />
      </TableCell>
    </TableRow>
    <Show when={props.expanded}>
      <TableRow class="hover:bg-transparent">
        <TableCell
          class="p-0 whitespace-normal"
          colSpan={3}
        >
          <DiplomaDetailsTable
            diplomas={props.summary.filteredDiplomas}
            getFileUrl={props.getFileUrl}
            getStatusOpacity={props.getStatusOpacity}
          />
        </TableCell>
      </TableRow>
    </Show>
  </>
);

export default MentorRow;
