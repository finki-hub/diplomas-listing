import { Download } from 'lucide-solid';
import { For, Show } from 'solid-js';

import type { Diploma } from '@/types';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn.ts';

import type { DiplomaDetailsTableProps } from './types';

import { getStatusOpacity } from '../../utils';

const StatusBadge = (props: { status: string }) => (
  <Badge
    class="whitespace-normal"
    style={{ opacity: getStatusOpacity(props.status) }}
    variant="default"
  >
    {props.status || '\u2014'}
  </Badge>
);

const DateDisplay = (props: { value: string }) => (
  <>{props.value || '\u2014'}</>
);

const DownloadButton = (props: { class?: string; url: null | string }) => (
  <span title={props.url === null ? 'Не постои' : undefined}>
    <a
      class={cn(
        'inline-flex items-center justify-center rounded-md p-1.5 transition-colors hover:[&>svg]:text-black',
        props.url ? 'hover:bg-accent' : 'opacity-30 pointer-events-none',
        props.class,
      )}
      download=""
      href={props.url ?? undefined}
      target="_blank"
    >
      <Download class="h-4 w-4 transition-colors" />
    </a>
  </span>
);

const MobileDiplomaCard = (props: { diploma: Diploma }) => (
  <div class="overflow-hidden rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
    <div class="space-y-3 text-sm">
      <div>
        <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Студент
        </div>
        <div
          class="mt-1 wrap-break-word font-medium leading-5"
          style={{ 'overflow-wrap': 'anywhere' }}
        >
          {props.diploma.student}
        </div>
      </div>
      <div>
        <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Наслов
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
            Статус
          </div>
          <div class="mt-1">
            <StatusBadge status={props.diploma.status} />
          </div>
        </div>
        <div class="min-w-0">
          <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Датум
          </div>
          <div class="mt-1 wrap-break-word text-muted-foreground">
            <DateDisplay value={props.diploma.dateOfSubmission} />
          </div>
        </div>
        <Show when={props.diploma.fileUrl !== null}>
          <div class="min-w-0">
            <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Датотека
            </div>
            <div class="mt-1">
              <DownloadButton
                class="w-full bg-primary text-primary-foreground"
                url={props.diploma.fileUrl}
              />
            </div>
          </div>
        </Show>
      </div>
    </div>
  </div>
);

const DiplomaDetailsTable = (props: DiplomaDetailsTableProps) => (
  <div class="bg-muted/30 px-3 py-3 sm:px-8 sm:py-4">
    <div class="space-y-3 sm:hidden">
      <For each={props.diplomas}>
        {(diploma) => <MobileDiplomaCard diploma={diploma} />}
      </For>
    </div>

    <table class="hidden w-full text-sm sm:table">
      <thead>
        <tr class="border-b text-muted-foreground">
          <th class="pb-2 text-left font-medium">Студент</th>
          <th class="pb-2 text-left font-medium">Наслов</th>
          <th class="pb-2 text-left font-medium">Статус</th>
          <th class="pb-2 text-left font-medium">Датум</th>
          <th class="pb-2 text-left font-medium">Датотека</th>
        </tr>
      </thead>
      <tbody>
        <For each={props.diplomas}>
          {(diploma) => (
            <tr class="border-b border-border/50 last:border-0">
              <td class="py-2 pr-4">{diploma.student}</td>
              <td
                class="max-w-xs py-2 pr-4 truncate"
                title={diploma.title}
              >
                {diploma.title}
              </td>
              <td class="py-2 pr-4">
                <StatusBadge status={diploma.status} />
              </td>
              <td class="py-2 text-muted-foreground">
                <DateDisplay value={diploma.dateOfSubmission} />
              </td>
              <td class="py-2 text-center">
                <DownloadButton url={diploma.fileUrl} />
              </td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  </div>
);

export default DiplomaDetailsTable;
