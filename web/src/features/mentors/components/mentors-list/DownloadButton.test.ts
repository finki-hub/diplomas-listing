/* eslint-disable camelcase -- assert the fixed telemetry event schema. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as AnalyticsModule from '@/lib/analytics.ts';

import { captureAnalytics } from '@/lib/analytics.ts';

import { performDownload } from './downloadExecution';

vi.mock('@/lib/analytics.ts', () => ({ captureAnalytics: vi.fn() }));
vi.mock('solid-sonner', () => ({ toast: { error: vi.fn() } }));

const successfulResponse = () => ({
  blob: vi.fn().mockResolvedValue(new Blob(['file'])),
  headers: { get: () => 'attachment; filename="thesis-private.pdf"' },
  ok: true,
  status: 200,
});
const validUUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NativeURL = URL;
// eslint-disable-next-line unicorn/prefer-temporal -- PostHog's SDK event contract uses Date.
const sdkTimestamp = new Date(0);

const performDownloadWithoutAttempt = async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse()));
  await performDownload(
    'https://example.invalid/private',
    { getSearchAttemptId: () => {}, section: 'diplomas' },
    { notifyError: vi.fn(), notifyNotFound: vi.fn() },
  );
};

describe('download result telemetry', () => {
  const capture = vi.mocked(captureAnalytics);
  const append = vi.fn();
  const click = vi.fn();
  const remove = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('document', {
      body: { append },
      createElement: () => ({ click, download: '', href: '', remove }),
    });
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:private-url',
      revokeObjectURL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const resultProperties = () => capture.mock.calls[0]?.[1];

  it('records one browser handoff with the attempt snapshot taken before fetch resolves', async () => {
    vi.stubGlobal('URL', NativeURL);
    const actualAnalytics =
      await vi.importActual<typeof AnalyticsModule>('@/lib/analytics.ts');
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:private-url',
      revokeObjectURL,
    });
    const sanitizedEvents: Array<
      NonNullable<ReturnType<typeof actualAnalytics.sanitizeAnalytics>>
    > = [];
    capture.mockImplementation((event, properties) => {
      const sanitizedEvent = actualAnalytics.sanitizeAnalytics({
        event,
        properties,
        timestamp: sdkTimestamp,
        uuid: validUUID,
      });
      if (sanitizedEvent) sanitizedEvents.push(sanitizedEvent);
    });
    const { promise: pendingFetch, resolve: resolveFetch } =
      Promise.withResolvers<Response>();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => pendingFetch),
    );
    let currentId: string | undefined = validUUID;
    const getSearchAttemptId = vi.fn(() => currentId);

    const pending = performDownload(
      'https://example.invalid/private?secret=1',
      { getSearchAttemptId, section: 'diplomas' },
      { notifyError: vi.fn(), notifyNotFound: vi.fn() },
    );
    currentId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    resolveFetch(successfulResponse() as unknown as Response);
    await pending;

    expect(getSearchAttemptId).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(sanitizedEvents[0]?.properties).toMatchObject({
      outcome: 'browser_handoff',
      search_attempt_id: validUUID,
      section: 'diplomas',
    });
    expect(sanitizedEvents[0]?.uuid).toBe(validUUID);
    expect(sanitizedEvents[0]?.timestamp).toEqual(sdkTimestamp);
    expect(capture).toHaveBeenCalledWith('document_download_result', {
      outcome: 'browser_handoff',
      search_attempt_id: validUUID,
      section: 'diplomas',
    });
    expect(JSON.stringify(resultProperties())).not.toContain('private');
    expect(append).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    await performDownloadWithoutAttempt();
    expect(sanitizedEvents.at(-1)?.properties).not.toHaveProperty(
      'search_attempt_id',
    );
  });

  it.each([
    {
      caseName: '404',
      notFound: true,
      outcome: 'not_found',
      response: { ok: false, status: 404 },
    },
    {
      caseName: 'other HTTP failure',
      notFound: false,
      outcome: 'http_error',
      response: { ok: false, status: 503 },
    },
    {
      caseName: 'missing filename',
      notFound: false,
      outcome: 'invalid_response',
      response: {
        headers: { get: () => null },
        ok: true,
        status: 200,
      },
    },
  ] as const)('handles $caseName', async ({ notFound, outcome, response }) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const notifyNotFound = vi.fn();
    const notifyError = vi.fn();

    await performDownload(
      'https://example.invalid/private',
      { getSearchAttemptId: () => {}, section: 'masters' },
      { notifyError, notifyNotFound },
    );

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('document_download_result', {
      outcome,
      section: 'masters',
    });
    expect(notifyNotFound).toHaveBeenCalledTimes(notFound ? 1 : 0);
    expect(notifyError).toHaveBeenCalledTimes(notFound ? 0 : 1);
  });

  it.each(['fetch rejection', 'blob rejection', 'browser handoff failure'])(
    'reports client_error on %s',
    async (failure) => {
      const response = successfulResponse();
      if (failure === 'fetch rejection') {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private')));
      } else {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue(
            failure === 'blob rejection'
              ? {
                  ...response,
                  blob: vi.fn().mockRejectedValue(new Error('private')),
                }
              : response,
          ),
        );
        if (failure === 'browser handoff failure') {
          click.mockImplementationOnce(() => {
            throw new Error('private');
          });
        }
      }

      const notifyError = vi.fn();
      await performDownload(
        'https://example.invalid/private',
        { getSearchAttemptId: () => {}, section: 'diplomas' },
        { notifyError, notifyNotFound: vi.fn() },
      );

      expect(capture).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledWith('document_download_result', {
        outcome: 'client_error',
        section: 'diplomas',
      });
      expect(notifyError).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(capture.mock.calls)).not.toContain('private');
    },
  );

  it('fails open when attempt lookup or analytics throws and omits an unavailable ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse()));
    capture.mockImplementation(() => {
      throw new Error('private');
    });

    await expect(
      performDownload(
        'https://example.invalid/private',
        {
          getSearchAttemptId: () => {
            throw new Error('private');
          },
          section: 'diplomas',
        },
        { notifyError: vi.fn(), notifyNotFound: vi.fn() },
      ),
    ).resolves.toBeUndefined();

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('document_download_result', {
      outcome: 'browser_handoff',
      section: 'diplomas',
    });
  });
});
