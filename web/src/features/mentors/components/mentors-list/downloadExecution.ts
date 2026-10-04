/* eslint-disable camelcase -- telemetry properties follow the event schema. */
import { captureAnalytics } from '@/lib/analytics.ts';

export type DownloadTelemetryProps = {
  getSearchAttemptId: () => string | undefined;
  section: 'diplomas' | 'masters';
};

type DownloadOutcome =
  | 'browser_handoff'
  | 'client_error'
  | 'http_error'
  | 'invalid_response'
  | 'not_found';

const FILENAME_REGEX = /filename="?(?<filename>[^";\n]+)"?/u;

const getFilename = (response: Response): null | string => {
  if (!response.ok) {
    return null;
  }

  const disposition = response.headers.get('Content-Disposition');
  if (!disposition?.includes('filename=')) {
    return null;
  }

  const match = FILENAME_REGEX.exec(disposition);
  return match?.groups?.['filename'] ?? null;
};

const captureDownloadResult = (
  section: DownloadTelemetryProps['section'],
  outcome: DownloadOutcome,
  searchAttemptId: string | undefined,
) => {
  try {
    captureAnalytics('document_download_result', {
      ...(searchAttemptId !== undefined && {
        search_attempt_id: searchAttemptId,
      }),
      outcome,
      section,
    });
  } catch {
    // Telemetry must not affect the download flow.
  }
};

export const performDownload = async (
  url: string,
  telemetry: DownloadTelemetryProps,
  notifyNotFound: () => void,
  notifyError: () => void,
) => {
  let searchAttemptId: string | undefined;
  try {
    searchAttemptId = telemetry.getSearchAttemptId();
  } catch {
    // A failing optional telemetry lookup must not block a user action.
  }

  let outcome: DownloadOutcome = 'client_error';
  try {
    const response = await fetch(url);

    if (response.status === 404) {
      outcome = 'not_found';
      notifyNotFound();
      return;
    }

    if (!response.ok) {
      outcome = 'http_error';
      notifyError();
      return;
    }

    const filename = getFilename(response);
    if (filename === null) {
      outcome = 'invalid_response';
      notifyError();
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
    outcome = 'browser_handoff';
  } catch {
    notifyError();
  } finally {
    captureDownloadResult(telemetry.section, outcome, searchAttemptId);
  }
};
