import { Moon, Sun } from 'lucide-solid';
import { createSignal, onMount, Show } from 'solid-js';

import { useLanguage } from '@/lib/LanguageProvider';
import { readBrowserStorage, writeBrowserStorage } from '@/lib/safe-storage';

type Theme = 'dark' | 'light';

const getInitialTheme = (): Theme => {
  const stored = readBrowserStorage('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const [theme, setTheme] = createSignal<Theme>(getInitialTheme());

const applyTheme = (t: Theme) => {
  document.documentElement.dataset['kbTheme'] = t;
  writeBrowserStorage('theme', t);
};

export default function ThemeToggle() {
  const { t } = useLanguage();
  onMount(() => {
    applyTheme(theme());
  });

  const toggle = () => {
    const next = theme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      aria-label={t().themeToggle}
      class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={toggle}
    >
      <Show
        fallback={<Moon class="h-4 w-4" />}
        when={theme() === 'dark'}
      >
        <Sun class="h-4 w-4" />
      </Show>
    </button>
  );
}
