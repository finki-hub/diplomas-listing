import { Show } from 'solid-js';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type MentorsStatsCardsProps = {
  loading: boolean;
  median: number;
  totalDiplomas: number;
  totalMentors: number;
};

const MentorsStatsCards = (props: MentorsStatsCardsProps) => (
  <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Card>
      <CardHeader class="px-4 sm:px-6">
        <CardDescription>Вкупно ментори</CardDescription>
        <CardTitle class="text-2xl sm:text-3xl">
          <Show
            fallback="..."
            when={!props.loading}
          >
            {props.totalMentors}
          </Show>
        </CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader class="px-4 sm:px-6">
        <CardDescription>Вкупно дипломски</CardDescription>
        <CardTitle class="text-2xl sm:text-3xl">
          <Show
            fallback="..."
            when={!props.loading}
          >
            {props.totalDiplomas}
          </Show>
        </CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader class="px-4 sm:px-6">
        <CardDescription>Просек по ментор</CardDescription>
        <CardTitle class="text-2xl sm:text-3xl">
          <Show
            fallback="..."
            when={!props.loading}
          >
            {props.totalMentors > 0
              ? (props.totalDiplomas / props.totalMentors).toFixed(1)
              : '0'}
          </Show>
        </CardTitle>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader class="px-4 sm:px-6">
        <CardDescription>Медијана по ментор</CardDescription>
        <CardTitle class="text-2xl sm:text-3xl">
          <Show
            fallback="..."
            when={!props.loading}
          >
            {props.median}
          </Show>
        </CardTitle>
      </CardHeader>
    </Card>
  </div>
);

export default MentorsStatsCards;
