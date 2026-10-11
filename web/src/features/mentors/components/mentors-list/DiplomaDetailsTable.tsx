import { For, Show } from 'solid-js';

import type { Diploma } from '@/types';

import { Badge } from '@/components/ui/badge';
import DownloadButton from '@/features/mentors/components/mentors-list/DownloadButton.tsx';
import { formatThesisDate } from '@/lib/format';
import { useLanguage } from '@/lib/LanguageProvider';
import { getStatusLabel } from '@/lib/statuses';

import type { SectionId } from '../../section';
import type { DiplomaDetailsTableProps } from './types';

import { displayName } from '../../utils';

const StatusBadge = (props: {
  opacity: number;
  section: SectionId;
  status: string;
}) => {
  const { language } = useLanguage();
  return (
    <Badge
      class="whitespace-normal"
      style={{ opacity: props.opacity }}
      variant="default"
    >
      {getStatusLabel(props.status, props.section, language()) || '\u{2014}'}
    </Badge>
  );
};

const DateDisplay = (props: { value: string }) => {
  const { language } = useLanguage();
  return <>{formatThesisDate(props.value, language())}</>;
};

const MobileDiplomaCard = (props: {
  diploma: Diploma;
  getFileUrl: (fileId: null | string) => null | string;
  getSearchAttemptId: () => string | undefined;
  getStatusOpacity: (status: string) => number;
  section: 'diplomas' | 'masters';
}) => {
  const { language, t } = useLanguage();
  return (
    <div class="overflow-hidden rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <div class="space-y-3 text-sm">
        <div>
          <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t().student}
          </div>
          <div
            class="mt-1 wrap-break-word font-medium leading-5"
            style={{ 'overflow-wrap': 'anywhere' }}
          >
            {displayName(props.diploma.student, language())}
          </div>
        </div>
        <div>
          <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t().title}
          </div>
          <div
            class="mt-1 wrap-break-word leading-5 text-foreground/90"
            style={{ 'overflow-wrap': 'anywhere' }}
          >
            {props.diploma.title}
          </div>
        </div>
        <div class="grid gap-3 rounded-lg bg-muted/40 p-3">
          <div class="min-w-0">
            <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t().status}
            </div>
            <div class="mt-1">
              <StatusBadge
                opacity={props.getStatusOpacity(props.diploma.status)}
                section={props.section}
                status={props.diploma.status}
              />
            </div>
          </div>
          <div class="min-w-0">
            <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t().date}
            </div>
            <div class="mt-1 wrap-break-word text-muted-foreground">
              <DateDisplay value={props.diploma.dateOfSubmission} />
            </div>
          </div>
          <Show when={props.diploma.fileId !== null}>
            <div class="min-w-0">
              <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t().file}
              </div>
              <div class="mt-1">
                <DownloadButton
                  class="w-full bg-primary text-primary-foreground"
                  getSearchAttemptId={props.getSearchAttemptId}
                  section={props.section}
                  url={props.getFileUrl(props.diploma.fileId)}
                />
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

const DiplomaDetailsTable = (props: DiplomaDetailsTableProps) => {
  const { language, t } = useLanguage();
  return (
    <div class="bg-muted/30 px-3 py-3 sm:px-8 sm:py-4">
      <div class="space-y-3 sm:hidden">
        <For each={props.diplomas}>
          {(diploma) => (
            <MobileDiplomaCard
              diploma={diploma}
              getFileUrl={props.getFileUrl}
              getSearchAttemptId={props.getSearchAttemptId}
              getStatusOpacity={props.getStatusOpacity}
              section={props.section}
            />
          )}
        </For>
      </div>

      <table class="hidden w-full text-sm sm:table">
        <thead>
          <tr class="border-b text-muted-foreground">
            <th class="pb-2 pr-4 text-left font-medium">{t().student}</th>
            <th class="pb-2 pr-4 text-left font-medium">{t().title}</th>
            <th class="pb-2 pr-4 text-left font-medium">{t().status}</th>
            <th class="pb-2 pr-4 text-left font-medium">{t().date}</th>
            <th class="pb-2 text-left font-medium">{t().file}</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.diplomas}>
            {(diploma) => (
              <tr class="border-b border-border/50 last:border-0">
                <td class="py-2 pr-4 whitespace-nowrap">
                  {displayName(diploma.student, language())}
                </td>
                <td
                  class="max-w-xs py-2 pr-4 truncate"
                  title={diploma.title}
                >
                  {diploma.title}
                </td>
                <td class="py-2 pr-4">
                  <StatusBadge
                    opacity={props.getStatusOpacity(diploma.status)}
                    section={props.section}
                    status={diploma.status}
                  />
                </td>
                <td class="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                  <DateDisplay value={diploma.dateOfSubmission} />
                </td>
                <td class="py-2 text-center">
                  <DownloadButton
                    getSearchAttemptId={props.getSearchAttemptId}
                    section={props.section}
                    url={props.getFileUrl(diploma.fileId)}
                  />
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
};

export default DiplomaDetailsTable;
