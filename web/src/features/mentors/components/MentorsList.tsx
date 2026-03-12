import { For, Show } from 'solid-js';

import type { Diploma } from '@/types';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { FilteredMentorSummary, SortDirection, SortField } from '../types';

import { getStatusOpacity } from '../utils';

type DiplomaCountBadgeProps = {
  filteredCount: number;
  hasSearch: boolean;
  opacity: number;
  totalCount: number;
};

type DiplomaDetailsTableProps = {
  diplomas: Diploma[];
};

type MentorMobileCardProps = {
  expanded: boolean;
  getBadgeOpacity: (count: number) => number;
  hasSearch: boolean;
  index: number;
  onToggle: () => void;
  summary: FilteredMentorSummary;
};

type MentorRowProps = MentorMobileCardProps;

type MentorsListProps = {
  expandedMentor: null | string;
  filteredSummaries: FilteredMentorSummary[];
  getBadgeOpacity: (count: number) => number;
  hasSearch: boolean;
  mentorSummariesCount: number;
  onSort: (field: SortField) => void;
  onToggle: (mentor: string) => void;
  sortDirection: SortDirection;
  sortField: SortField;
};

type MentorTableHeaderProps = {
  onSort: (field: SortField) => void;
  sortDirection: SortDirection;
  sortField: SortField;
};

type MobileSortControlsProps = MentorTableHeaderProps;

type SortIconProps = {
  currentDirection: SortDirection;
  currentField: SortField;
  field: SortField;
};

const SortIcon = (props: SortIconProps) => (
  <Show when={props.currentField === props.field}>
    <svg
      class="ml-1 inline-block h-4 w-4"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Show
        fallback={<path d="M12 5v14m4-4l-4 4m-4-4l4 4" />}
        when={props.currentDirection === 'asc'}
      >
        <path d="M12 19V5m-4 4l4-4m4 4l-4-4" />
      </Show>
    </svg>
  </Show>
);

const DiplomaCountBadge = (props: DiplomaCountBadgeProps) => (
  <Badge
    style={{ opacity: props.opacity }}
    variant="default"
  >
    {props.hasSearch && props.filteredCount !== props.totalCount
      ? `${props.filteredCount} / ${props.totalCount}`
      : props.totalCount}
  </Badge>
);

const DiplomaDetailsTable = (props: DiplomaDetailsTableProps) => (
  <div class="bg-muted/30 px-3 py-3 sm:px-8 sm:py-4">
    <div class="space-y-3 sm:hidden">
      <For each={props.diplomas}>
        {(diploma) => (
          <div class="overflow-hidden rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
            <div class="space-y-3 text-sm">
              <div>
                <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Студент
                </div>
                <div
                  class="mt-1 wrap-break-word font-medium leading-5"
                  style={{ 'overflow-wrap': 'anywhere' }}
                >
                  {diploma.student}
                </div>
              </div>
              <div>
                <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Наслов
                </div>
                <div
                  class="mt-1 wrap-break-word leading-5 text-foreground/90"
                  style={{ 'overflow-wrap': 'anywhere' }}
                >
                  {diploma.title}
                </div>
              </div>
              <div class="grid gap-3 rounded-lg bg-muted/40 p-3">
                <div class="min-w-0">
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Статус
                  </div>
                  <div class="mt-1">
                    <Badge
                      class="max-w-full whitespace-normal wrap-break-word text-left leading-4"
                      style={{ opacity: getStatusOpacity(diploma.status) }}
                      variant="default"
                    >
                      {diploma.status || '—'}
                    </Badge>
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Датум
                  </div>
                  <div class="mt-1 wrap-break-word text-muted-foreground">
                    {diploma.dateOfSubmission || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>

    <table class="hidden w-full text-sm sm:table">
      <thead>
        <tr class="border-b text-muted-foreground">
          <th class="pb-2 text-left font-medium">Студент</th>
          <th class="pb-2 text-left font-medium">Наслов</th>
          <th class="pb-2 text-left font-medium">Статус</th>
          <th class="pb-2 text-left font-medium">Датум</th>
        </tr>
      </thead>
      <tbody>
        <For each={props.diplomas}>
          {(diploma) => (
            <tr class="border-b border-border/50 last:border-0">
              <td class="py-2 pr-4">{diploma.student}</td>
              <td
                class="max-w-xs py-2 pr-4 truncate"
                title={diploma.title}
              >
                {diploma.title}
              </td>
              <td class="py-2 pr-4">
                <Badge
                  style={{ opacity: getStatusOpacity(diploma.status) }}
                  variant="default"
                >
                  {diploma.status || '—'}
                </Badge>
              </td>
              <td class="py-2 text-muted-foreground">
                {diploma.dateOfSubmission || '—'}
              </td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  </div>
);

const MentorMobileCard = (props: MentorMobileCardProps) => (
  <Card class="gap-0 overflow-hidden border-border/70 py-0 shadow-sm sm:hidden">
    <button
      aria-expanded={props.expanded}
      class="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/20"
      onClick={() => {
        props.onToggle();
      }}
      type="button"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <svg
          class={`h-4 w-4 transition-transform duration-200 ${props.expanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Ментор #{props.index + 1}
            </div>
            <div
              class="mt-1 wrap-break-word text-sm font-semibold leading-5"
              style={{ 'overflow-wrap': 'anywhere' }}
            >
              {props.summary.mentor}
            </div>
          </div>
          <DiplomaCountBadge
            filteredCount={props.summary.filteredDiplomas.length}
            hasSearch={props.hasSearch}
            opacity={props.getBadgeOpacity(props.summary.totalDiplomas)}
            totalCount={props.summary.totalDiplomas}
          />
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          {props.expanded ? 'Сокриј детали' : 'Прикажи детали'}
        </div>
      </div>
    </button>

    <Show when={props.expanded}>
      <div class="border-t border-border/60 bg-muted/20">
        <DiplomaDetailsTable diplomas={props.summary.filteredDiplomas} />
      </div>
    </Show>
  </Card>
);

const MentorRow = (props: MentorRowProps) => (
  <>
    <TableRow
      class="cursor-pointer"
      onClick={props.onToggle}
    >
      <TableCell class="text-center text-muted-foreground">
        {props.index + 1}
      </TableCell>
      <TableCell class="font-medium">
        <div class="flex items-center gap-2">
          <svg
            class={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              props.expanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span class="truncate">{props.summary.mentor}</span>
        </div>
      </TableCell>
      <TableCell class="text-right">
        <DiplomaCountBadge
          filteredCount={props.summary.filteredDiplomas.length}
          hasSearch={props.hasSearch}
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
          <DiplomaDetailsTable diplomas={props.summary.filteredDiplomas} />
        </TableCell>
      </TableRow>
    </Show>
  </>
);

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
          Дипломски трудови
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

const MobileSortControls = (props: MobileSortControlsProps) => (
  <div class="mb-4 space-y-2 sm:hidden">
    <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
      Сортирање
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        class={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors ${
          props.sortField === 'totalDiplomas'
            ? 'border-primary/40 bg-primary/10 text-foreground'
            : 'border-border bg-background text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => {
          props.onSort('totalDiplomas');
        }}
        type="button"
      >
        По број
        <SortIcon
          currentDirection={props.sortDirection}
          currentField={props.sortField}
          field="totalDiplomas"
        />
      </button>
      <button
        class={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors ${
          props.sortField === 'mentor'
            ? 'border-primary/40 bg-primary/10 text-foreground'
            : 'border-border bg-background text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => {
          props.onSort('mentor');
        }}
        type="button"
      >
        По ментор
        <SortIcon
          currentDirection={props.sortDirection}
          currentField={props.sortField}
          field="mentor"
        />
      </button>
    </div>
  </div>
);

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
              hasSearch={props.hasSearch}
              index={index()}
              onToggle={() => {
                props.onToggle(summary.mentor);
              }}
              summary={summary}
            />
          )}
        </For>
      </Show>
    </div>

    <div class="hidden rounded-md border sm:block">
      <Table>
        <MentorTableHeader
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
                  hasSearch={props.hasSearch}
                  index={index()}
                  onToggle={() => {
                    props.onToggle(summary.mentor);
                  }}
                  summary={summary}
                />
              )}
            </For>
          </Show>
        </TableBody>
      </Table>
    </div>

    <div class="mt-4 text-sm text-muted-foreground">
      <Show when={props.hasSearch}>
        Прикажани {props.filteredSummaries.length} од{' '}
        {props.mentorSummariesCount} ментори
      </Show>
    </div>
  </>
);

export default MentorsList;
