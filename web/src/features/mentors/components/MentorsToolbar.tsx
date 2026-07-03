import { For } from 'solid-js';

import MentorsSearchInput from './MentorsSearchInput';

type MentorsToolbarProps = {
  countLabel: string;
  filteredDiplomasCount: number;
  filteredMentorsCount: number;
  lastUpdatedAt: null | string;
  search: string;
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

const formatLastUpdatedAt = (value: null | string) => {
  if (!value) return 'Се подготвува освежување...';

  // eslint-disable-next-line unicorn/prefer-temporal -- Temporal is not yet available in the target browsers and the project ships no polyfill.
  const updatedAt = new Date(value);

  return new Intl.DateTimeFormat('mk-MK', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(updatedAt);
};

const MentorsToolbar = (props: MentorsToolbarProps) => (
  <div class="mb-4 rounded-2xl border border-border/60 bg-linear-to-br from-muted/25 via-background to-muted/10 p-4 shadow-sm sm:p-5">
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.15fr)] xl:items-end">
      <label class="block space-y-1.5">
        <span class={fieldLabelClass}>Пребарување</span>
        <MentorsSearchInput
          onInput={props.setSearch}
          value={props.search}
        />
      </label>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(140px,0.85fr)] xl:items-end">
        <label class="block space-y-1.5">
          <span class={fieldLabelClass}>Статус</span>
          <select
            class={selectClass}
            onChange={(event) => {
              props.setStatusFilter(event.currentTarget.value);
            }}
            value={props.statusFilter}
          >
            <option value="">Сите статуси</option>
            <For each={props.statusOptions}>
              {(status) => <option value={status}>{status}</option>}
            </For>
          </select>
        </label>

        <label class="block space-y-1.5">
          <span class={fieldLabelClass}>Година</span>
          <select
            class={selectClass}
            onChange={(event) => {
              props.setYearFilter(event.currentTarget.value);
            }}
            value={props.yearFilter}
          >
            <option value="">Сите години</option>
            <For each={props.yearOptions}>
              {(year) => <option value={year}>{year}</option>}
            </For>
          </select>
        </label>
      </div>
    </div>

    <div class="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div>
        Прикажани {props.filteredMentorsCount} од {props.totalMentorsCount}{' '}
        ментори · {props.filteredDiplomasCount} од {props.totalDiplomasCount}{' '}
        {props.countLabel}
      </div>
      <div>Последно освежување: {formatLastUpdatedAt(props.lastUpdatedAt)}</div>
    </div>
  </div>
);

export default MentorsToolbar;
