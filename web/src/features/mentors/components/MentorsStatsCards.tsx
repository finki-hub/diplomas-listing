import { type JSX, Show } from 'solid-js';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatNumber, formatPercentage } from '@/lib/format';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

import type { SectionId } from '../section';

type MentorsStatsCardsProps = {
  loading: boolean;
  median: number;
  section: SectionId;
  topTenDiplomasCount: number;
  topTenMentorsShare: number;
  totalDiplomas: number;
  totalMentors: number;
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

const MentorsStatsCards = (props: MentorsStatsCardsProps) => {
  const { language, t } = useLanguage();
  return (
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatCard
        description={t().totalMentors}
        loading={props.loading}
        value={formatNumber(props.totalMentors, language())}
      />
      <StatCard
        description={t().sections[props.section].totalThesesLabel}
        loading={props.loading}
        value={formatNumber(props.totalDiplomas, language())}
      />
      <StatCard
        description={t().average}
        loading={props.loading}
        value={formatNumber(
          props.totalMentors > 0 ? props.totalDiplomas / props.totalMentors : 0,
          language(),
          { maximumFractionDigits: 1, minimumFractionDigits: 1 },
        )}
      />
      <StatCard
        description={t().median}
        loading={props.loading}
        value={formatNumber(props.median, language())}
      />
      <StatCard
        description={t().topTenShare}
        footer={
          <CardDescription>
            {interpolate(t().sections[props.section].topTenCount, {
              shown: formatNumber(props.topTenDiplomasCount, language(), {
                useGrouping: false,
              }),
              total: formatNumber(props.totalDiplomas, language(), {
                useGrouping: false,
              }),
            })}
          </CardDescription>
        }
        loading={props.loading}
        value={formatPercentage(props.topTenMentorsShare, language())}
      />
    </div>
  );
};

export default MentorsStatsCards;
