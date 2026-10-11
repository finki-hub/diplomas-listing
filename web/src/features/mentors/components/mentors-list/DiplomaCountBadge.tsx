import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';
import { useLanguage } from '@/lib/LanguageProvider';

import type { DiplomaCountBadgeProps } from './types';

const DiplomaCountBadge = (props: DiplomaCountBadgeProps) => {
  const { language } = useLanguage();
  return (
    <Badge
      style={{ opacity: props.opacity }}
      variant="default"
    >
      {props.hasActiveFilters && props.filteredCount !== props.totalCount
        ? `${formatNumber(props.filteredCount, language())} / ${formatNumber(props.totalCount, language())}`
        : formatNumber(props.totalCount, language())}
    </Badge>
  );
};

export default DiplomaCountBadge;
