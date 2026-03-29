import { Download, LoaderCircle } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { cn } from '@/lib/cn.ts';

const getFilename = (response: Response): null | string => {
  if (!response.ok) {
    return null;
  }

  const disposition = response.headers.get('Content-Disposition');
  if (!disposition?.includes('filename=')) {
    return null;
  }

  const match = /filename="?(?<filename>[^";\n]+)"?/u.exec(disposition);
  return match?.groups?.['filename'] ?? null;
};

const DownloadButton = (props: { class?: string; url: null | string }) => {
  const [isLoading, setIsLoading] = createSignal(false);

  const handleDownload = async () => {
    if (props.url === null || isLoading()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(props.url);

      if (response.status === 404) {
        toast.error('Датотеката не постои');
        return;
      }

      const filename = getFilename(response);
      if (filename === null) {
        toast.error('Грешка при преземање на датотеката');
        return;
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = downloadUrl;

      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      toast.error('Грешка при преземање на датотеката');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      aria-disabled={isLoading()}
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
