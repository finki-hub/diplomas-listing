import { siGithub } from 'simple-icons';

import ThemeToggle from '@/components/ThemeToggle';

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

const MentorsPageHeader = () => (
  <div class="border-b">
    <div class="container mx-auto flex min-h-16 items-center gap-3 py-3 sm:h-16 sm:py-0">
      <img
        alt="ФИНКИ Хаб"
        class="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
        src="/logo.png"
      />
      <h1 class="min-w-0 flex-1 text-base font-bold leading-tight tracking-tight sm:text-xl">
        ФИНКИ Хаб / Дипломски
      </h1>
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <a
          class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="https://github.com/finki-hub/diplomas-listing"
          rel="noopener noreferrer"
          target="_blank"
          title="GitHub репозиториум"
        >
          <GitHubIcon />
        </a>
        <ThemeToggle />
      </div>
    </div>
  </div>
);

export default MentorsPageHeader;
