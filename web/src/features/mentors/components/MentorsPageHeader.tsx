import { siGithub } from 'simple-icons';

import { LanguageSelect } from '@/components/LanguageSelect';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/lib/LanguageProvider';

const GitHubIcon = () => (
  <svg
    aria-hidden="true"
    class="h-5 w-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={siGithub.path} />
  </svg>
);

type MentorsPageHeaderProps = {
  title: string;
};

const MentorsPageHeader = (props: MentorsPageHeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <header class="border-b">
      <div class="container mx-auto grid min-h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-3 sm:flex sm:h-16 sm:gap-3 sm:py-0">
        <img
          alt={t().brand}
          class="h-12 w-12 shrink-0 object-contain"
          src="/logo.png"
        />
        <h1 class="min-w-0 flex-1 wrap-break-word text-base font-bold leading-tight tracking-tight sm:text-xl">
          {props.title}
        </h1>
        <div class="col-span-2 ml-auto flex shrink-0 items-center gap-2">
          <a
            aria-label={t().github}
            class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="https://github.com/finki-hub/diplomas-listing"
            rel="noopener noreferrer"
            target="_blank"
            title={t().github}
          >
            <GitHubIcon />
          </a>
          <LanguageSelect
            label={t().language}
            language={language()}
            setLanguage={setLanguage}
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default MentorsPageHeader;
