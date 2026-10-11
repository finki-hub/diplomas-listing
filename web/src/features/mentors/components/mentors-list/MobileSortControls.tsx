import { useLanguage } from '@/lib/LanguageProvider';

import type { SortField } from '../../types';
import type { SortControlsProps } from './types';

import SortIcon from './SortIcon';

type SortButtonProps = {
  field: SortField;
  label: string;
  onSort: (field: SortField) => void;
  sortDirection: SortControlsProps['sortDirection'];
  sortField: SortControlsProps['sortField'];
};

const SortButton = (props: SortButtonProps) => (
  <button
    class={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors ${
      props.sortField === props.field
        ? 'border-primary/40 bg-primary/10 text-foreground'
        : 'border-border bg-background text-muted-foreground hover:text-foreground'
    }`}
    onClick={() => {
      props.onSort(props.field);
    }}
    type="button"
  >
    {props.label}
    <SortIcon
      currentDirection={props.sortDirection}
      currentField={props.sortField}
      field={props.field}
    />
  </button>
);

const MobileSortControls = (props: SortControlsProps) => {
  const { t } = useLanguage();
  return (
    <div class="mb-4 space-y-2 sm:hidden">
      <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {t().sorting}
      </div>
      <div class="flex flex-wrap gap-2">
        <SortButton
          field="totalDiplomas"
          label={t().sortCount}
          onSort={props.onSort}
          sortDirection={props.sortDirection}
          sortField={props.sortField}
        />
        <SortButton
          field="mentor"
          label={t().sortMentor}
          onSort={props.onSort}
          sortDirection={props.sortDirection}
          sortField={props.sortField}
        />
      </div>
    </div>
  );
};

export default MobileSortControls;
