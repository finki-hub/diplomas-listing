import { useNavigate } from '@solidjs/router';
import { For, Show } from 'solid-js';

import { cn } from '@/lib/cn';

import { DIPLOMAS_SECTION, MASTERS_SECTION, type SectionId } from '../section';

type SectionSwitchProps = {
  active: SectionId;
};

type SectionTab = {
  basePath: string;
  label: string;
  value: SectionId;
};

const sectionTabs: SectionTab[] = [
  {
    basePath: DIPLOMAS_SECTION.basePath,
    label: 'Дипломски',
    value: DIPLOMAS_SECTION.id,
  },
  {
    basePath: MASTERS_SECTION.basePath,
    label: 'Магистерски',
    value: MASTERS_SECTION.id,
  },
];

const SectionSwitch = (props: SectionSwitchProps) => {
  const navigate = useNavigate();

  return (
    <div
      class="inline-flex flex-wrap rounded-xl bg-muted p-1"
      role="tablist"
    >
      <For each={sectionTabs}>
        {(tab) => (
          <button
            aria-selected={props.active === tab.value}
            class={cn(
              'relative inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all',
              props.active === tab.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => {
              navigate(tab.basePath);
            }}
            role="tab"
            type="button"
          >
            {tab.label}
            <Show when={props.active === tab.value}>
              <span class="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary" />
            </Show>
          </button>
        )}
      </For>
    </div>
  );
};

export default SectionSwitch;
