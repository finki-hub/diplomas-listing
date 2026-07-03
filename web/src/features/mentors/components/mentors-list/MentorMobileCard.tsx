import { ChevronRight } from 'lucide-solid';
import { Show } from 'solid-js';

import { Card } from '@/components/ui/card';

import type { MentorListItemProps } from './types';

import DiplomaCountBadge from './DiplomaCountBadge';
import DiplomaDetailsTable from './DiplomaDetailsTable';

const MentorMobileCard = (props: MentorListItemProps) => (
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
        <ChevronRight
          class={`h-4 w-4 transition-transform duration-200 ${props.expanded ? 'rotate-90' : ''}`}
        />
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
            hasActiveFilters={props.hasActiveFilters}
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
        <DiplomaDetailsTable
          diplomas={props.summary.filteredDiplomas}
          getStatusOpacity={props.getStatusOpacity}
          showFileColumn={props.showFileColumn}
        />
      </div>
    </Show>
  </Card>
);

export default MentorMobileCard;
