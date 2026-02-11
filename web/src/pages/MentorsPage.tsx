import { createMemo, createResource, createSignal, For, Show } from 'solid-js';

import type { Diploma, MentorSummary } from '@/types';

import ThemeToggle from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_URL = 'https://diplomski-api.finki-hub.com/diplomas';

const fetchDiplomas = async (): Promise<Diploma[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch diplomas');
  }
  return (await response.json()) as Diploma[];
};

const aggregateByMentor = (diplomas: Diploma[]): MentorSummary[] => {
  const mentorMap = new Map<string, Diploma[]>();

  for (const diploma of diplomas) {
    const mentor = diploma.mentor.trim();
    if (!mentor) continue;

    const existing = mentorMap.get(mentor);
    if (existing) {
      existing.push(diploma);
    } else {
      mentorMap.set(mentor, [diploma]);
    }
  }

  return Array.from(mentorMap.entries())
    .map(([mentor, mentorDiplomas]) => ({
      diplomas: mentorDiplomas,
      mentor,
      totalDiplomas: mentorDiplomas.length,
    }))
    .sort((a, b) => b.totalDiplomas - a.totalDiplomas);
};

const STATUS_STAGES: Array<[string, number]> = [
  ['пријава', 1],
  ['прифаќање', 2],
  ['валидирање од службата', 3],
  ['одобрение од продекан', 4],
  ['одобрение за оценка', 5],
  ['забелешки', 6],
  ['валидирање на услови', 7],
  ['одбран', 8],
  ['архив', 9],
];

const getStatusOpacity = (status: string): number => {
  const lower = status.toLowerCase();
  for (const [keyword, stage] of STATUS_STAGES) {
    if (lower.includes(keyword)) {
      return 0.3 + (stage / 9) * 0.7;
    }
  }
  return 0.3;
};

type FilteredMentorSummary = MentorSummary & { filteredDiplomas: Diploma[] };

const SortIcon = (props: {
  currentDirection: SortDirection;
  currentField: SortField;
  field: SortField;
}) => (
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

const DiplomaDetailsTable = (props: { diplomas: Diploma[] }) => (
  <div class="bg-muted/30 px-8 py-4">
    <table class="w-full text-sm">
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
                class="py-2 pr-4 max-w-xs truncate"
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
type SortDirection = 'asc' | 'desc';

type SortField = 'mentor' | 'totalDiplomas';

const LoadingSpinner = () => (
  <div class="flex items-center justify-center py-12">
    <div class="flex flex-col items-center gap-3">
      <svg
        class="h-8 w-8 animate-spin text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        />
      </svg>
      <p class="text-sm text-muted-foreground">Се вчитуваат податоците...</p>
    </div>
  </div>
);

const StatsCards = (props: {
  loading: boolean;
  median: number;
  totalDiplomas: number;
  totalMentors: number;
}) => (
  <div class="mb-8 grid gap-4 md:grid-cols-4">
    <Card>
      <CardHeader>
        <CardDescription>Вкупно ментори</CardDescription>
        <CardTitle class="text-3xl">
          <Show
            fallback="..."
            when={!props.loading}
          >
            {props.totalMentors}
          </Show>
        </CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader>
        <CardDescription>Вкупно дипломски</CardDescription>
        <CardTitle class="text-3xl">
          <Show
            fallback="..."
            when={!props.loading}
          >
            {props.totalDiplomas}
          </Show>
        </CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader>
        <CardDescription>Просек по ментор</CardDescription>
        <CardTitle class="text-3xl">
          <Show
            fallback="..."
            when={!props.loading}
          >
            {props.totalMentors > 0
              ? (props.totalDiplomas / props.totalMentors).toFixed(1)
              : '0'}
          </Show>
        </CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader>
        <CardDescription>Медијана по ментор</CardDescription>
        <CardTitle class="text-3xl">
          <Show
            fallback="..."
            when={!props.loading}
          >
            {props.median}
          </Show>
        </CardTitle>
      </CardHeader>
    </Card>
  </div>
);

const DiplomaCountBadge = (props: {
  filteredCount: number;
  hasSearch: boolean;
  opacity: number;
  totalCount: number;
}) => (
  <Badge
    style={{ opacity: props.opacity }}
    variant="default"
  >
    {props.hasSearch && props.filteredCount !== props.totalCount
      ? `${props.filteredCount} / ${props.totalCount}`
      : props.totalCount}
  </Badge>
);

const MentorRow = (props: {
  expanded: boolean;
  getBadgeOpacity: (count: number) => number;
  hasSearch: boolean;
  index: number;
  onToggle: () => void;
  summary: FilteredMentorSummary;
}) => (
  <>
    <TableRow
      class="cursor-pointer"
      onClick={props.onToggle}
    >
      <TableCell class="hidden sm:table-cell text-center text-muted-foreground">
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
          <span class="sm:hidden">
            <DiplomaCountBadge
              filteredCount={props.summary.filteredDiplomas.length}
              hasSearch={props.hasSearch}
              opacity={props.getBadgeOpacity(props.summary.totalDiplomas)}
              totalCount={props.summary.totalDiplomas}
            />
          </span>
        </div>
      </TableCell>
      <TableCell class="hidden sm:table-cell text-right">
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
          class="p-0"
          colSpan={3}
        >
          <DiplomaDetailsTable diplomas={props.summary.filteredDiplomas} />
        </TableCell>
      </TableRow>
    </Show>
  </>
);

const MentorTableHeader = (props: {
  onSort: (field: SortField) => void;
  sortDirection: SortDirection;
  sortField: SortField;
}) => (
  <TableHeader>
    <TableRow>
      <TableHead class="hidden sm:table-cell w-[50px] text-center">#</TableHead>
      <TableHead>
        <div class="flex items-center gap-2">
          <button
            class="flex items-center font-medium hover:text-foreground/80 transition-colors"
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
          <span class="sm:hidden text-muted-foreground">|</span>
          <button
            class="sm:hidden flex items-center font-medium hover:text-foreground/80 transition-colors"
            onClick={() => {
              props.onSort('totalDiplomas');
            }}
          >
            Бр.
            <SortIcon
              currentDirection={props.sortDirection}
              currentField={props.sortField}
              field="totalDiplomas"
            />
          </button>
        </div>
      </TableHead>
      <TableHead class="hidden sm:table-cell text-right">
        <button
          class="ml-auto flex items-center font-medium hover:text-foreground/80 transition-colors"
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

const SearchInput = (props: {
  onInput: (value: string) => void;
  value: string;
}) => (
  <div class="mb-4">
    <input
      class="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onInput={(e: InputEvent & { currentTarget: HTMLInputElement }) => {
        props.onInput(e.currentTarget.value);
      }}
      placeholder="Пребарувај по ментор, наслов, или студент..."
      type="text"
      value={props.value}
    />
  </div>
);

export default function MentorsPage() {
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
          .map((s) => {
            const mentorMatches = s.mentor.toLowerCase().includes(query);
            const matchingDiplomas = s.diplomas.filter(
              (d) =>
                d.title.toLowerCase().includes(query) ||
                d.student.toLowerCase().includes(query),
            );
            if (mentorMatches || matchingDiplomas.length > 0) {
              return {
                ...s,
                filteredDiplomas: mentorMatches ? s.diplomas : matchingDiplomas,
              };
            }
            return null;
          })
          .filter((s): s is NonNullable<typeof s> => s !== null)
      : mentorSummaries().map((s) => ({
          ...s,
          filteredDiplomas: s.diplomas,
        }));

    const field = sortField();
    const direction = sortDirection();

    return [...results].sort((a, b) => {
      let comparison = 0;
      if (field === 'mentor') {
        comparison = a.mentor.localeCompare(b.mentor);
      } else {
        comparison = query
          ? a.filteredDiplomas.length - b.filteredDiplomas.length
          : a.totalDiplomas - b.totalDiplomas;
      }
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  const totalDiplomasCount = createMemo(() => diplomas()?.length ?? 0);

  const totalMentorsCount = createMemo(() => mentorSummaries().length);

  const maxDiplomas = createMemo(() => {
    const summaries = mentorSummaries();
    if (summaries.length === 0) return 1;
    return Math.max(...summaries.map((s) => s.totalDiplomas));
  });

  const getBadgeOpacity = (count: number) => {
    const min = 0.3;
    const max = 1;
    return min + (count / maxDiplomas()) * (max - min);
  };

  const medianDiplomas = createMemo((): number => {
    const summaries = mentorSummaries();
    if (summaries.length === 0) return 0;
    const counts = summaries.map((s) => s.totalDiplomas).sort((a, b) => a - b);
    const mid = Math.floor(counts.length / 2);
    if (counts.length % 2 === 0) {
      return ((counts[mid - 1] ?? 0) + (counts[mid] ?? 0)) / 2;
    }
    return counts[mid] ?? 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'totalDiplomas' ? 'desc' : 'asc');
    }
  };

  const toggleExpanded = (mentor: string) => {
    setExpandedMentor((prev) => (prev === mentor ? null : mentor));
  };

  return (
    <div class="min-h-screen bg-background">
      <div class="border-b">
        <div class="container mx-auto flex h-16 items-center px-4">
          <h1 class="text-xl font-bold tracking-tight">ФИНКИ ДИПЛОМСКИ</h1>
          <div class="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main class="container mx-auto px-4 py-8">
        <StatsCards
          loading={diplomas.loading}
          median={medianDiplomas()}
          totalDiplomas={totalDiplomasCount()}
          totalMentors={totalMentorsCount()}
        />

        {/* Search + Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ментори и дипломски трудови</CardTitle>
            <CardDescription>
              Преглед на сите ментори и нивните дипломски трудови. Кликнете на
              ред за да ги видите деталите. Податоците се ажурираат на секој
              час.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchInput
              onInput={setSearch}
              value={search()}
            />

            {/* Loading state */}
            <Show when={diplomas.loading}>
              <LoadingSpinner />
            </Show>

            {/* Error state */}
            <Show when={diplomas.error !== undefined}>
              <div class="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                Грешка при вчитување на податоците. Обидете се повторно подоцна.
              </div>
            </Show>

            {/* Table */}
            <Show when={!diplomas.loading && !diplomas.error}>
              <div class="rounded-md border">
                <Table>
                  <MentorTableHeader
                    onSort={handleSort}
                    sortDirection={sortDirection()}
                    sortField={sortField()}
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
                      when={filteredSummaries().length > 0}
                    >
                      <For each={filteredSummaries()}>
                        {(summary, index) => (
                          <MentorRow
                            expanded={expandedMentor() === summary.mentor}
                            getBadgeOpacity={getBadgeOpacity}
                            hasSearch={Boolean(search())}
                            index={index()}
                            onToggle={() => {
                              toggleExpanded(summary.mentor);
                            }}
                            summary={summary}
                          />
                        )}
                      </For>
                    </Show>
                  </TableBody>
                </Table>
              </div>

              {/* Footer info */}
              <div class="mt-4 text-sm text-muted-foreground">
                <Show when={search()}>
                  Прикажани {filteredSummaries().length} од{' '}
                  {mentorSummaries().length} ментори
                </Show>
              </div>
            </Show>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
