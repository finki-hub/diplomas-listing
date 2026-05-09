import { Show } from 'solid-js';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LoadingSpinner from '@/features/mentors/components/LoadingSpinner';
import MentorsList from '@/features/mentors/components/MentorsList';
import MentorsPageHeader from '@/features/mentors/components/MentorsPageHeader';
import MentorsStatsCards from '@/features/mentors/components/MentorsStatsCards';
import MentorsToolbar from '@/features/mentors/components/MentorsToolbar';
import { useMentorsPageState } from '@/features/mentors/hooks/useMentorsPageState';

export default function MentorsPage() {
  const state = useMentorsPageState();

  return (
    <div class="min-h-screen bg-background">
      <MentorsPageHeader />

      <main class="container mx-auto py-6 sm:py-8">
        <MentorsStatsCards
          loading={state.diplomas.loading}
          median={state.medianDiplomas()}
          topTenDiplomasCount={state.topTenDiplomasCount()}
          topTenMentorsShare={state.topTenMentorsShare()}
          totalDiplomas={state.totalDiplomasCount()}
          totalMentors={state.totalMentorsCount()}
        />

        <Card class="overflow-hidden">
          <CardHeader class="px-4 sm:px-6">
            <CardTitle>Ментори и дипломски трудови</CardTitle>
            <CardDescription>
              Преглед на сите ментори и нивните дипломски трудови. Кликнете на
              ред за да ги видите деталите. Податоците се ажурираат на секој
              час.
            </CardDescription>
          </CardHeader>
          <CardContent class="px-4 pb-6 sm:px-6">
            <MentorsToolbar
              filteredDiplomasCount={state.filteredDiplomasCount()}
              filteredMentorsCount={state.filteredSummaries().length}
              lastUpdatedAt={state.lastUpdatedAt()}
              search={state.search()}
              setSearch={state.setSearch}
              setStatusFilter={state.setStatusFilter}
              setYearFilter={state.setYearFilter}
              statusFilter={state.statusFilter()}
              statusOptions={state.statusOptions()}
              totalDiplomasCount={state.totalDiplomasCount()}
              totalMentorsCount={state.totalMentorsCount()}
              yearFilter={state.yearFilter()}
              yearOptions={state.yearOptions()}
            />

            <Show
              when={state.diplomas.loading && state.totalDiplomasCount() === 0}
            >
              <LoadingSpinner />
            </Show>

            <Show when={state.diplomas.error !== undefined}>
              <div class="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                Грешка при вчитување на податоците. Обидете се повторно подоцна.
              </div>
            </Show>

            <Show
              when={
                state.diplomas.error === undefined &&
                (!state.diplomas.loading || state.totalDiplomasCount() > 0)
              }
            >
              <MentorsList
                expandedMentor={state.expandedMentor()}
                filteredSummaries={state.filteredSummaries()}
                getBadgeOpacity={state.getBadgeOpacity}
                hasActiveFilters={state.hasActiveFilters()}
                onSort={state.handleSort}
                onToggle={state.toggleExpanded}
                sortDirection={state.sortDirection()}
                sortField={state.sortField()}
              />
            </Show>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
