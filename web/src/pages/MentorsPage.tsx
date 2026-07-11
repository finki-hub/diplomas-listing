import { createEffect, Show } from 'solid-js';

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
import SectionSwitch from '@/features/mentors/components/SectionSwitch';
import { useMentorsPageState } from '@/features/mentors/hooks/useMentorsPageState';
import { type SectionConfig } from '@/features/mentors/section';

type MentorsPageProps = {
  readonly config: SectionConfig;
};

export default function MentorsPage(props: MentorsPageProps) {
  // eslint-disable-next-line solid/reactivity -- each section mounts its own MentorsPage instance, so the config never changes within a mount.
  const state = useMentorsPageState(props.config);

  createEffect(() => {
    document.title = props.config.strings.headerTitle;
  });

  return (
    <div class="min-h-screen bg-background">
      <MentorsPageHeader title={props.config.strings.headerTitle} />

      <main class="container mx-auto py-6 sm:py-8">
        <div class="mb-6">
          <SectionSwitch active={props.config.id} />
        </div>

        <MentorsStatsCards
          countLabel={props.config.strings.countLabel}
          loading={state.diplomas.loading}
          median={state.medianDiplomas()}
          topTenDiplomasCount={state.topTenDiplomasCount()}
          topTenMentorsShare={state.topTenMentorsShare()}
          totalDiplomas={state.totalDiplomasCount()}
          totalMentors={state.totalMentorsCount()}
          totalThesesLabel={props.config.strings.totalThesesLabel}
        />

        <Card class="overflow-hidden">
          <CardHeader class="px-4 sm:px-6">
            <CardTitle>{props.config.strings.cardTitle}</CardTitle>
            <CardDescription>
              {props.config.strings.cardDescription}
            </CardDescription>
          </CardHeader>
          <CardContent class="px-4 pb-6 sm:px-6">
            <MentorsToolbar
              countLabel={props.config.strings.countLabel}
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
                getFileUrl={props.config.getFileUrl}
                getStatusOpacity={state.getStatusOpacity}
                hasActiveFilters={state.hasActiveFilters()}
                onSort={state.handleSort}
                onToggle={state.toggleExpanded}
                sortDirection={state.sortDirection()}
                sortField={state.sortField()}
                tableCountHeader={props.config.strings.tableCountHeader}
              />
            </Show>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
