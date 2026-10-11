import { For } from 'solid-js';

import { formatNumber, formatUpdatedAt } from '@/lib/format';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getStatusLabel } from '@/lib/statuses';

import type { SectionId } from '../section';

import MentorsSearchInput from './MentorsSearchInput';

type MentorsToolbarProps = {
  filteredDiplomasCount: number;
  filteredMentorsCount: number;
  isStale: boolean;
  lastUpdatedAt: null | string;
  search: string;
  section: SectionId;
  setSearch: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setYearFilter: (value: string) => void;
  statusFilter: string;
  statusOptions: string[];
  totalDiplomasCount: number;
  totalMentorsCount: number;
  yearFilter: string;
  yearOptions: string[];
};

const selectClass =
  'h-11 w-full rounded-lg border border-border/70 bg-background/90 px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const fieldLabelClass =
  'text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground';

const MentorsToolbar = (props: MentorsToolbarProps) => {
  const { language, t } = useLanguage();
  const date = () =>
    props.lastUpdatedAt
      ? formatUpdatedAt(props.lastUpdatedAt, language())
      : t().refreshPending;
  return (
    <div class="mb-4 rounded-2xl border border-border/60 bg-linear-to-br from-muted/25 via-background to-muted/10 p-4 shadow-sm sm:p-5">
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.15fr)] xl:items-end">
        <label class="block space-y-1.5">
          <span class={fieldLabelClass}>{t().search}</span>
          <MentorsSearchInput
            onInput={props.setSearch}
            value={props.search}
          />
        </label>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(140px,0.85fr)] xl:items-end">
          <label class="block space-y-1.5">
            <span class={fieldLabelClass}>{t().status}</span>
            <select
              class={selectClass}
              onChange={(event) => {
                props.setStatusFilter(event.currentTarget.value);
              }}
              value={props.statusFilter}
            >
              <option
                selected={props.statusFilter === ''}
                value=""
              >
                {t().allStatuses}
              </option>
              <For each={props.statusOptions}>
                {(status) => (
                  <option
                    selected={props.statusFilter === status}
                    value={status}
                  >
                    {getStatusLabel(status, props.section, language())}
                  </option>
                )}
              </For>
            </select>
          </label>

          <label class="block space-y-1.5">
            <span class={fieldLabelClass}>{t().year}</span>
            <select
              class={selectClass}
              onChange={(event) => {
                props.setYearFilter(event.currentTarget.value);
              }}
              value={props.yearFilter}
            >
              <option
                selected={props.yearFilter === ''}
                value=""
              >
                {t().allYears}
              </option>
              <For each={props.yearOptions}>
                {(year) => (
                  <option
                    selected={props.yearFilter === year}
                    value={year}
                  >
                    {year}
                  </option>
                )}
              </For>
            </select>
          </label>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          {interpolate(t().mentorsResults, {
            shown: formatNumber(props.filteredMentorsCount, language()),
            total: formatNumber(props.totalMentorsCount, language()),
          })}
          {' · '}
          {interpolate(t().sections[props.section].results, {
            shown: formatNumber(props.filteredDiplomasCount, language()),
            total: formatNumber(props.totalDiplomasCount, language()),
          })}
        </div>
        <div
          aria-live="polite"
          class={props.isStale ? 'font-medium text-destructive' : undefined}
        >
          {interpolate(props.isStale ? t().staleUpdated : t().lastUpdated, {
            date: date(),
          })}
        </div>
      </div>
    </div>
  );
};

export default MentorsToolbar;
