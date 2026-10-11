import { useLocation } from '@solidjs/router';
import { RefreshCw } from 'lucide-solid';
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
import { useLanguage } from '@/lib/LanguageProvider';
import { updatePageMetadata } from '@/lib/page-metadata';

type MentorsPageProps = {
  readonly config: SectionConfig;
};

export default function MentorsPage(props: MentorsPageProps) {
  const { language, t } = useLanguage();
  const location = useLocation();
  const strings = () => t().sections[props.config.id];
  // eslint-disable-next-line solid/reactivity -- Each section reads its config and initial URL state once per mount.
  const state = useMentorsPageState(props.config, language, location.search);

  createEffect(() => {
    updatePageMetadata(language(), props.config.id, document);
  });

  return (
    <div class="min-h-screen bg-background">
      <MentorsPageHeader title={strings().headerTitle} />

      <main class="container mx-auto py-6 sm:py-8">
        <div class="mb-6">
          <SectionSwitch active={props.config.id} />
        </div>

        <MentorsStatsCards
          loading={state.diplomas.loading}
          median={state.medianDiplomas()}
          section={props.config.id}
          topTenDiplomasCount={state.topTenDiplomasCount()}
          topTenMentorsShare={state.topTenMentorsShare()}
          totalDiplomas={state.totalDiplomasCount()}
          totalMentors={state.totalMentorsCount()}
        />

        <Card class="overflow-hidden">
          <CardHeader class="px-4 sm:px-6">
            <CardTitle>{strings().cardTitle}</CardTitle>
            <CardDescription>{strings().cardDescription}</CardDescription>
          </CardHeader>
          <CardContent class="px-4 pb-6 sm:px-6">
            <MentorsToolbar
              filteredDiplomasCount={state.filteredDiplomasCount()}
              filteredMentorsCount={state.filteredSummaries().length}
              isStale={state.isStale()}
              lastUpdatedAt={state.lastUpdatedAt()}
              search={state.search()}
              section={props.config.id}
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

            <Show when={state.loadError() !== null}>
              <div
                class="flex flex-col items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
                role="alert"
              >
                <span>{t().loadError}</span>
                <button
                  class="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-destructive/30 bg-background px-3 font-medium text-foreground ring-offset-background transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  disabled={state.diplomas.loading}
                  onClick={() => state.refetchDiplomas()}
                  type="button"
                >
                  <RefreshCw
                    aria-hidden="true"
                    class="h-4 w-4"
                  />
                  {t().retry}
                </button>
              </div>
            </Show>

            <Show
              when={
                state.loadError() === null &&
                (!state.diplomas.loading || state.totalDiplomasCount() > 0)
              }
            >
              <MentorsList
                expandedMentor={state.expandedMentor()}
                filteredSummaries={state.filteredSummaries()}
                getBadgeOpacity={state.getBadgeOpacity}
                getFileUrl={props.config.getFileUrl}
                getSearchAttemptId={state.getSearchAttemptId}
                getStatusOpacity={state.getStatusOpacity}
                hasActiveFilters={state.hasActiveFilters()}
                onSort={state.handleSort}
                onToggle={state.toggleExpanded}
                section={props.config.id}
                sortDirection={state.sortDirection()}
                sortField={state.sortField()}
                tableCountHeader={strings().tableCountHeader}
              />
            </Show>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
