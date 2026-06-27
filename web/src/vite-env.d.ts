import 'vite/client';

declare global {
  /* eslint-disable @typescript-eslint/consistent-type-definitions -- interface declaration merging is required to extend Vite's ImportMetaEnv. */
  interface ImportMetaEnv {
    readonly VITE_POSTHOG_HOST?: string;
    readonly VITE_POSTHOG_KEY?: string;
  }
  /* eslint-enable @typescript-eslint/consistent-type-definitions -- Re-enable after the Vite env augmentation. */
}
