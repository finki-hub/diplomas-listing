import { Download, LoaderCircle } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { cn } from '@/lib/cn.ts';

import {
  type DownloadTelemetryProps,
  performDownload,
} from './downloadExecution';

const DownloadButton = (
  props: DownloadTelemetryProps & {
    class?: string;
    url: null | string;
  },
) => {
  const [isLoading, setIsLoading] = createSignal(false);

  const handleDownload = async () => {
    if (props.url === null || isLoading()) {
      return;
    }

    setIsLoading(true);

    try {
      await performDownload(
        props.url,
        props,
        () => toast.error('Датотеката не постои'),
        () => toast.error('Грешка при преземање на датотеката'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      aria-disabled={isLoading()}
      aria-label={props.url === null ? 'Не постои' : 'Преземи'}
      class={cn(
        'inline-flex items-center justify-center rounded-md p-1.5 transition-colors',
        'disabled:opacity-30 disabled:cursor-default',
        isLoading() ? 'opacity-70 cursor-default' : 'cursor-pointer',
        !isLoading() &&
          props.url !== null &&
          'hover:bg-accent hover:[&>svg]:text-background',
        props.class,
      )}
      disabled={props.url === null}
      onClick={handleDownload}
      title={props.url === null ? 'Не постои' : 'Преземи'}
      type="button"
    >
      <Show
        fallback={<Download class="h-4 w-4 transition-colors" />}
        when={isLoading()}
      >
        <LoaderCircle class="h-4 w-4 animate-spin transition-colors" />
      </Show>
    </button>
  );
};

export default DownloadButton;
