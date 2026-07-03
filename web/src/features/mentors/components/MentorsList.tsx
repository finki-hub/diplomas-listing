import { For, Show } from 'solid-js';

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

import type { MentorsListProps } from './mentors-list/types';

import MentorMobileCard from './mentors-list/MentorMobileCard';
import MentorRow from './mentors-list/MentorRow';
import MentorTableHeader from './mentors-list/MentorTableHeader';
import MobileSortControls from './mentors-list/MobileSortControls';

const MentorsList = (props: MentorsListProps) => (
  <>
    <MobileSortControls
      onSort={props.onSort}
      sortDirection={props.sortDirection}
      sortField={props.sortField}
    />

    <div class="space-y-3 sm:hidden">
      <Show
        fallback={
          <div class="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Нема резултати.
          </div>
        }
        when={props.filteredSummaries.length > 0}
      >
        <For each={props.filteredSummaries}>
          {(summary, index) => (
            <MentorMobileCard
              expanded={props.expandedMentor === summary.mentor}
              getBadgeOpacity={props.getBadgeOpacity}
              getStatusOpacity={props.getStatusOpacity}
              hasActiveFilters={props.hasActiveFilters}
              index={index()}
              onToggle={() => {
                props.onToggle(summary.mentor);
              }}
              showFileColumn={props.showFileColumn}
              summary={summary}
            />
          )}
        </For>
      </Show>
    </div>

    <div class="hidden rounded-md border sm:block">
      <Table>
        <MentorTableHeader
          countHeaderLabel={props.tableCountHeader}
          onSort={props.onSort}
          sortDirection={props.sortDirection}
          sortField={props.sortField}
        />
        <TableBody>
          <Show
            fallback={
              <TableRow>
                <TableCell
                  class="h-24 text-center text-muted-foreground"
                  colSpan={3}
                >
                  Нема резултати.
                </TableCell>
              </TableRow>
            }
            when={props.filteredSummaries.length > 0}
          >
            <For each={props.filteredSummaries}>
              {(summary, index) => (
                <MentorRow
                  expanded={props.expandedMentor === summary.mentor}
                  getBadgeOpacity={props.getBadgeOpacity}
                  getStatusOpacity={props.getStatusOpacity}
                  hasActiveFilters={props.hasActiveFilters}
                  index={index()}
                  onToggle={() => {
                    props.onToggle(summary.mentor);
                  }}
                  showFileColumn={props.showFileColumn}
                  summary={summary}
                />
              )}
            </For>
          </Show>
        </TableBody>
      </Table>
    </div>
  </>
);

export default MentorsList;
