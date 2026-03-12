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
import MentorsSearchInput from '@/features/mentors/components/MentorsSearchInput';
import MentorsStatsCards from '@/features/mentors/components/MentorsStatsCards';
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
            <MentorsSearchInput
              onInput={state.setSearch}
              value={state.search()}
            />

            <Show when={state.diplomas.loading}>
              <LoadingSpinner />
            </Show>

            <Show when={state.diplomas.error !== undefined}>
              <div class="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                Грешка при вчитување на податоците. Обидете се повторно подоцна.
              </div>
            </Show>

            <Show when={!state.diplomas.loading && !state.diplomas.error}>
              <MentorsList
                expandedMentor={state.expandedMentor()}
                filteredSummaries={state.filteredSummaries()}
                getBadgeOpacity={state.getBadgeOpacity}
                hasSearch={Boolean(state.search())}
                mentorSummariesCount={state.totalMentorsCount()}
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
