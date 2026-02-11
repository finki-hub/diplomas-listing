import { createSignal, createResource, For, Show, createMemo } from "solid-js";
import type { Diploma, MentorSummary } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";

const API_URL = "https://diplomski-api.finki-hub.com/diplomas";

const fetchDiplomas = async (): Promise<Diploma[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch diplomas");
  }
  return response.json();
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
    .map(([mentor, diplomas]) => ({
      mentor,
      totalDiplomas: diplomas.length,
      diplomas,
    }))
    .sort((a, b) => b.totalDiplomas - a.totalDiplomas);
};

type SortField = "mentor" | "totalDiplomas";
type SortDirection = "asc" | "desc";

export default function MentorsPage() {
  const [diplomas] = createResource(fetchDiplomas);
  const [search, setSearch] = createSignal("");
  const [sortField, setSortField] = createSignal<SortField>("totalDiplomas");
  const [sortDirection, setSortDirection] = createSignal<SortDirection>("desc");
  const [expandedMentor, setExpandedMentor] = createSignal<string | null>(null);

  const mentorSummaries = createMemo(() => {
    const data = diplomas();
    if (!data) return [];
    return aggregateByMentor(data);
  });

  const filteredSummaries = createMemo(() => {
    const query = search().toLowerCase().trim();
    let results: (MentorSummary & { filteredDiplomas: Diploma[] })[];

    if (query) {
      results = mentorSummaries()
        .map((s) => {
          const mentorMatches = s.mentor.toLowerCase().includes(query);
          const matchingDiplomas = s.diplomas.filter(
            (d) =>
              d.title.toLowerCase().includes(query) ||
              d.student.toLowerCase().includes(query),
          );
          // Show mentor if their name matches or any diploma matches
          if (mentorMatches || matchingDiplomas.length > 0) {
            return {
              ...s,
              // If mentor name matched, show all diplomas; otherwise only matching ones
              filteredDiplomas: mentorMatches ? s.diplomas : matchingDiplomas,
            };
          }
          return null;
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);
    } else {
      results = mentorSummaries().map((s) => ({
        ...s,
        filteredDiplomas: s.diplomas,
      }));
    }

    const field = sortField();
    const direction = sortDirection();

    return [...results].sort((a, b) => {
      let comparison = 0;
      if (field === "mentor") {
        comparison = a.mentor.localeCompare(b.mentor);
      } else {
        comparison = query
          ? a.filteredDiplomas.length - b.filteredDiplomas.length
          : a.totalDiplomas - b.totalDiplomas;
      }
      return direction === "asc" ? comparison : -comparison;
    });
  });

  const totalDiplomasCount = createMemo(() => {
    return diplomas()?.length ?? 0;
  });

  const totalMentorsCount = createMemo(() => {
    return mentorSummaries().length;
  });

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

  const medianDiplomas = createMemo(() => {
    const summaries = mentorSummaries();
    if (summaries.length === 0) return 0;
    const counts = summaries.map((s) => s.totalDiplomas).sort((a, b) => a - b);
    const mid = Math.floor(counts.length / 2);
    return counts.length % 2 === 0
      ? (counts[mid - 1] + counts[mid]) / 2
      : counts[mid];
  });

  const STATUS_STAGES: [string, number][] = [
    ["пријава", 1],
    ["прифаќање", 2],
    ["валидирање од службата", 3],
    ["одобрение од продекан", 4],
    ["одобрение за оценка", 5],
    ["забелешки", 6],
    ["валидирање на услови", 7],
    ["одбран", 8],
    ["архив", 9],
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

  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "totalDiplomas" ? "desc" : "asc");
    }
  };

  const toggleExpanded = (mentor: string) => {
    setExpandedMentor((prev) => (prev === mentor ? null : mentor));
  };

  const SortIcon = (props: { field: SortField }) => {
    return (
      <Show when={sortField() === props.field}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="ml-1 inline-block h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <Show
            when={sortDirection() === "asc"}
            fallback={<path d="M12 5v14m4-4l-4 4m-4-4l4 4" />}
          >
            <path d="M12 19V5m-4 4l4-4m4 4l-4-4" />
          </Show>
        </svg>
      </Show>
    );
  };

  return (
    <div class="min-h-screen bg-background">
      <div class="border-b">
        <div class="container mx-auto flex h-16 items-center px-4">
          <h1 class="text-xl font-bold tracking-tight">
            ФИНКИ ДИПЛОМСКИ
          </h1>
          <div class="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main class="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div class="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Вкупно ментори</CardDescription>
              <CardTitle class="text-3xl">
                <Show when={!diplomas.loading} fallback="...">
                  {totalMentorsCount()}
                </Show>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Вкупно дипломски</CardDescription>
              <CardTitle class="text-3xl">
                <Show when={!diplomas.loading} fallback="...">
                  {totalDiplomasCount()}
                </Show>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Просек по ментор</CardDescription>
              <CardTitle class="text-3xl">
                <Show when={!diplomas.loading} fallback="...">
                  {totalMentorsCount() > 0
                    ? (totalDiplomasCount() / totalMentorsCount()).toFixed(1)
                    : "0"}
                </Show>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Медијана по ментор</CardDescription>
              <CardTitle class="text-3xl">
                <Show when={!diplomas.loading} fallback="...">
                  {medianDiplomas()}
                </Show>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search + Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ментори и дипломски трудови</CardTitle>
            <CardDescription>
              Преглед на сите ментори и нивните дипломски трудови. Кликнете на
              ред за да ги видите деталите. Податоците се ажурираат на секој час.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search input */}
            <div class="mb-4">
              <input
                type="text"
                placeholder="Пребарувај по ментор, наслов, или студент..."
                value={search()}
                onInput={(e) => setSearch(e.currentTarget.value)}
                class="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Loading state */}
            <Show when={diplomas.loading}>
              <div class="flex items-center justify-center py-12">
                <div class="flex flex-col items-center gap-3">
                  <svg
                    class="h-8 w-8 animate-spin text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
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
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p class="text-sm text-muted-foreground">
                    Се вчитуваат податоците...
                  </p>
                </div>
              </div>
            </Show>

            {/* Error state */}
            <Show when={diplomas.error}>
              <div class="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                Грешка при вчитување на податоците. Обидете се повторно подоцна.
              </div>
            </Show>

            {/* Table */}
            <Show when={!diplomas.loading && !diplomas.error}>
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead class="hidden sm:table-cell w-[50px] text-center">#</TableHead>
                      <TableHead>
                        <div class="flex items-center gap-2">
                          <button
                            class="flex items-center font-medium hover:text-foreground/80 transition-colors"
                            onClick={() => handleSort("mentor")}
                          >
                            Ментор
                            <SortIcon field="mentor" />
                          </button>
                          <span class="sm:hidden text-muted-foreground">|</span>
                          <button
                            class="sm:hidden flex items-center font-medium hover:text-foreground/80 transition-colors"
                            onClick={() => handleSort("totalDiplomas")}
                          >
                            Бр.
                            <SortIcon field="totalDiplomas" />
                          </button>
                        </div>
                      </TableHead>
                      <TableHead class="hidden sm:table-cell text-right">
                        <button
                          class="ml-auto flex items-center font-medium hover:text-foreground/80 transition-colors"
                          onClick={() => handleSort("totalDiplomas")}
                        >
                          Дипломски трудови
                          <SortIcon field="totalDiplomas" />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <Show
                      when={filteredSummaries().length > 0}
                      fallback={
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            class="h-24 text-center text-muted-foreground"
                          >
                            Нема резултати.
                          </TableCell>
                        </TableRow>
                      }
                    >
                      <For each={filteredSummaries()}>
                        {(summary, index) => (
                          <>
                            <TableRow
                              class="cursor-pointer"
                              onClick={() => toggleExpanded(summary.mentor)}
                            >
                              <TableCell class="hidden sm:table-cell text-center text-muted-foreground">
                                {index() + 1}
                              </TableCell>
                              <TableCell class="font-medium">
                                <div class="flex items-center gap-2">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                      expandedMentor() === summary.mentor
                                        ? "rotate-90"
                                        : ""
                                    }`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  >
                                    <path d="m9 18 6-6-6-6" />
                                  </svg>
                                  <span class="truncate">{summary.mentor}</span>
                                  <span class="sm:hidden">
                                    <Badge
                                      variant="default"
                                      style={{ opacity: getBadgeOpacity(summary.totalDiplomas) }}
                                    >
                                      {search() && summary.filteredDiplomas.length !== summary.totalDiplomas
                                        ? `${summary.filteredDiplomas.length} / ${summary.totalDiplomas}`
                                        : summary.totalDiplomas}
                                    </Badge>
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell class="hidden sm:table-cell text-right">
                                <Badge
                                  variant="default"
                                  style={{ opacity: getBadgeOpacity(summary.totalDiplomas) }}
                                >
                                  {search() && summary.filteredDiplomas.length !== summary.totalDiplomas
                                    ? `${summary.filteredDiplomas.length} / ${summary.totalDiplomas}`
                                    : summary.totalDiplomas}
                                </Badge>
                              </TableCell>
                            </TableRow>
                            {/* Expanded Details */}
                            <Show
                              when={expandedMentor() === summary.mentor}
                            >
                              <TableRow class="hover:bg-transparent">
                                <TableCell
                                  colSpan={3}
                                  class="p-0"
                                >
                                  <div class="bg-muted/30 px-8 py-4">
                                    <table class="w-full text-sm">
                                      <thead>
                                        <tr class="border-b text-muted-foreground">
                                          <th class="pb-2 text-left font-medium">
                                            Студент
                                          </th>
                                          <th class="pb-2 text-left font-medium">
                                            Наслов
                                          </th>
                                          <th class="pb-2 text-left font-medium">
                                            Статус
                                          </th>
                                          <th class="pb-2 text-left font-medium">
                                            Датум
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <For each={summary.filteredDiplomas}>
                                          {(diploma) => (
                                            <tr class="border-b border-border/50 last:border-0">
                                              <td class="py-2 pr-4">
                                                {diploma.student}
                                              </td>
                                              <td class="py-2 pr-4 max-w-xs truncate" title={diploma.title}>
                                                {diploma.title}
                                              </td>
                                              <td class="py-2 pr-4">
                                                <Badge
                                                  variant="default"
                                                  style={{ opacity: getStatusOpacity(diploma.status) }}
                                                >
                                                  {diploma.status || "—"}
                                                </Badge>
                                              </td>
                                              <td class="py-2 text-muted-foreground">
                                                {diploma.dateOfSubmission || "—"}
                                              </td>
                                            </tr>
                                          )}
                                        </For>
                                      </tbody>
                                    </table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </Show>
                          </>
                        )}
                      </For>
                    </Show>
                  </TableBody>
                </Table>
              </div>

              {/* Footer info */}
              <div class="mt-4 text-sm text-muted-foreground">
                <Show when={search()}>
                  Прикажани {filteredSummaries().length} од{" "}
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
