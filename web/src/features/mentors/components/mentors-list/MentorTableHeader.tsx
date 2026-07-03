import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type { MentorTableHeaderProps } from './types';

import SortIcon from './SortIcon';

const MentorTableHeader = (props: MentorTableHeaderProps) => (
  <TableHeader>
    <TableRow>
      <TableHead class="w-12.5 text-center">#</TableHead>
      <TableHead>
        <button
          class="flex items-center font-medium transition-colors hover:text-foreground/80"
          onClick={() => {
            props.onSort('mentor');
          }}
        >
          Ментор
          <SortIcon
            currentDirection={props.sortDirection}
            currentField={props.sortField}
            field="mentor"
          />
        </button>
      </TableHead>
      <TableHead class="text-right">
        <button
          class="ml-auto flex items-center font-medium transition-colors hover:text-foreground/80"
          onClick={() => {
            props.onSort('totalDiplomas');
          }}
        >
          {props.countHeaderLabel}
          <SortIcon
            currentDirection={props.sortDirection}
            currentField={props.sortField}
            field="totalDiplomas"
          />
        </button>
      </TableHead>
    </TableRow>
  </TableHeader>
);

export default MentorTableHeader;
