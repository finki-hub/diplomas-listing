import { type JSX, Show } from 'solid-js';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type MentorsStatsCardsProps = {
  countLabel: string;
  loading: boolean;
  median: number;
  topTenDiplomasCount: number;
  topTenMentorsShare: number;
  totalDiplomas: number;
  totalMentors: number;
  totalThesesLabel: string;
};

type StatCardProps = {
  description: string;
  footer?: JSX.Element;
  loading: boolean;
  value: JSX.Element;
};

const StatCard = (props: StatCardProps) => (
  <Card>
    <CardHeader class="px-4 sm:px-6">
      <CardDescription>{props.description}</CardDescription>
      <CardTitle class="text-2xl sm:text-3xl">
        <Show
          fallback="..."
          when={!props.loading}
        >
          {props.value}
        </Show>
      </CardTitle>
      {props.footer}
    </CardHeader>
  </Card>
);

const MentorsStatsCards = (props: MentorsStatsCardsProps) => (
  <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    <StatCard
      description="Вкупно ментори"
      loading={props.loading}
      value={props.totalMentors}
    />
    <StatCard
      description={props.totalThesesLabel}
      loading={props.loading}
      value={props.totalDiplomas}
    />
    <StatCard
      description="Просек по ментор"
      loading={props.loading}
      value={
        props.totalMentors > 0
          ? (props.totalDiplomas / props.totalMentors).toFixed(1)
          : '0'
      }
    />
    <StatCard
      description="Медијана по ментор"
      loading={props.loading}
      value={props.median}
    />
    <StatCard
      description="Удел на топ 10 ментори"
      footer={
        <CardDescription>
          {props.topTenDiplomasCount} од {props.totalDiplomas}{' '}
          {props.countLabel}
        </CardDescription>
      }
      loading={props.loading}
      value={<>{props.topTenMentorsShare.toFixed(1)}%</>}
    />
  </div>
);

export default MentorsStatsCards;
