/* eslint-disable camelcase -- Assert the telemetry protocol. */
import { createRoot } from 'solid-js';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import type { Diploma } from '@/types';

import { captureAnalytics } from '@/lib/analytics';

import type { CatalogResult } from '../api';
import type { SectionConfig } from '../section';

import { useMentorsPageState } from './useMentorsPageState';

vi.mock('@/lib/analytics', () => ({ captureAnalytics: vi.fn() }));

const DIPLOMA: Diploma = {
  dateOfSubmission: '13.09.2026',
  description: 'Description',
  fileId: null,
  member1: 'Member one',
  member2: 'Member two',
  mentor: 'Mentor',
  status: 'Одбран',
  student: 'Student',
  title: 'Recovered diploma',
};

const STRINGS = {
  cardDescription: 'Description',
  cardTitle: 'Title',
  countLabel: 'дипломски',
  headerTitle: 'Header',
  tableCountHeader: 'Diplomas',
  totalThesesLabel: 'Total',
} as const;

const createCatalogResult = (
  items: Diploma[],
  options?: Partial<Omit<CatalogResult, 'items'>>,
): CatalogResult => ({
  items,
  stale: options?.stale ?? false,
  updatedAt: options?.updatedAt ?? '2026-09-13T20:00:00.000Z',
});

const createTestState = (fetchTheses: SectionConfig['fetchTheses']) => {
  const config: SectionConfig = {
    basePath: '/',
    fetchTheses,
    getFileUrl: () => null,
    getStatusStage: () => null,
    id: 'diplomas',
    maxStatusStage: 9,
    strings: STRINGS,
  };
  let dispose: (() => void) | undefined;
  const state = createRoot((rootDispose) => {
    dispose = rootDispose;

    return useMentorsPageState(config);
  });

  onTestFinished(() => {
    dispose?.();
  });

  return { ...state, dispose: () => dispose?.() };
};

const stubBrowserLocation = (search: string): void => {
  vi.stubGlobal('location', { pathname: '/', search });
  vi.stubGlobal('history', { replaceState: vi.fn() });
};

describe('useMentorsPageState', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('settles only the latest search and links rank clicks without identity or stale linkage', async () => {
    vi.useFakeTimers();
    stubBrowserLocation('');
    const state = createTestState(() =>
      Promise.resolve(createCatalogResult([DIPLOMA])),
    );
    await vi.advanceTimersByTimeAsync(0);
    vi.mocked(captureAnalytics).mockClear();
    state.setSearch('Stud');
    await vi.advanceTimersByTimeAsync(300);
    state.setSearch('Student');
    await vi.advanceTimersByTimeAsync(499);
    expect(captureAnalytics).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(captureAnalytics).toHaveBeenCalledTimes(1);
    const properties = vi.mocked(captureAnalytics).mock.calls[0]?.[1];
    expect(properties).toMatchObject({
      result_count: 1,
      section: 'diplomas',
      trigger: 'query_edit',
    });
    expect(typeof properties?.['search_attempt_id']).toBe('string');
    state.toggleExpanded('Mentor');
    expect(captureAnalytics).toHaveBeenLastCalledWith('result_clicked', {
      position: 0,
      search_attempt_id: properties?.['search_attempt_id'],
      section: 'diplomas',
    });
    state.toggleExpanded('Mentor');
    state.setSearch('Stu');
    state.toggleExpanded('Mentor');
    expect(captureAnalytics).toHaveBeenLastCalledWith('result_clicked', {
      position: 0,
      section: 'diplomas',
    });
    expect(
      JSON.stringify(vi.mocked(captureAnalytics).mock.calls),
    ).not.toContain('Student');
    expect(
      JSON.stringify(vi.mocked(captureAnalytics).mock.calls),
    ).not.toContain('Mentor');
    state.dispose();
    const count = vi.mocked(captureAnalytics).mock.calls.length;
    await vi.advanceTimersByTimeAsync(1_000);
    expect(captureAnalytics).toHaveBeenCalledTimes(count);
  });

  it('waits for data, handles zero results and cancels cleared searches', async () => {
    vi.useFakeTimers();
    stubBrowserLocation('?q=Student');
    let resolveCatalog: ((value: CatalogResult) => void) | undefined;
    const state = createTestState(
      () =>
        new Promise((resolve) => {
          resolveCatalog = resolve;
        }),
    );
    state.setSearch('Student');
    await vi.advanceTimersByTimeAsync(1_000);
    expect(captureAnalytics).not.toHaveBeenCalled();
    resolveCatalog?.(createCatalogResult([DIPLOMA]));
    await vi.advanceTimersByTimeAsync(500);
    expect(captureAnalytics).toHaveBeenCalledWith(
      'catalog_search',
      expect.objectContaining({ result_count: 1 }),
    );
    state.setStatusFilter('Private unmatched status');
    await vi.advanceTimersByTimeAsync(500);
    expect(captureAnalytics).toHaveBeenLastCalledWith(
      'search_zero_results',
      expect.objectContaining({ result_count: 0 }),
    );
    state.setSearch('Private thesis title');
    state.setSearch('');
    const count = vi.mocked(captureAnalytics).mock.calls.length;
    await vi.advanceTimersByTimeAsync(1_000);
    expect(captureAnalytics).toHaveBeenCalledTimes(count);
    expect(
      JSON.stringify(vi.mocked(captureAnalytics).mock.calls),
    ).not.toContain('Private');
  });

  it('retries the failed catalog request when requested', async () => {
    // Given
    stubBrowserLocation('');
    const fetchTheses = vi
      .fn<() => Promise<CatalogResult>>()
      .mockResolvedValueOnce(createCatalogResult([]))
      .mockRejectedValueOnce(new Error('Catalog unavailable'))
      .mockResolvedValueOnce(createCatalogResult([DIPLOMA]));
    const state = createTestState(fetchTheses);
    await Promise.resolve();
    await Promise.resolve();
    await state.refetchDiplomas();
    expect(state.loadError()?.message).toBe('Catalog unavailable');
    expect(captureAnalytics).toHaveBeenLastCalledWith('catalog_load_result', {
      outcome: 'error',
      retained_data: true,
      section: 'diplomas',
      trigger: 'retry',
    });

    // When
    await state.refetchDiplomas();

    // Then
    expect(state.diplomas.state).toBe('ready');
    expect(state.diplomas()).toEqual([DIPLOMA]);
    expect(state.loadError()).toBe(null);
    expect(fetchTheses).toHaveBeenCalledTimes(3);
    expect(captureAnalytics).toHaveBeenLastCalledWith('catalog_load_result', {
      outcome: 'fresh',
      section: 'diplomas',
      trigger: 'retry',
    });
  });

  it('exposes only the settled current attempt and invalidates its getter synchronously', async () => {
    vi.useFakeTimers();
    stubBrowserLocation('');
    const state = createTestState(() =>
      Promise.resolve(createCatalogResult([DIPLOMA])),
    );
    await vi.advanceTimersByTimeAsync(0);
    state.setSearch('Student');
    await vi.advanceTimersByTimeAsync(500);
    expect(state.getSearchAttemptId()).toEqual(expect.any(String));
    state.setSearch('Changed');
    expect(state.getSearchAttemptId()).toBeUndefined();
  });

  it('restores settled linkage after a canceled query edit without another event', async () => {
    vi.useFakeTimers();
    stubBrowserLocation('');
    const state = createTestState(() =>
      Promise.resolve(createCatalogResult([DIPLOMA])),
    );
    await vi.advanceTimersByTimeAsync(0);
    state.setSearch('Student');
    await vi.advanceTimersByTimeAsync(500);
    const initialId = state.getSearchAttemptId();
    expect(initialId).toEqual(expect.any(String));

    const before = vi
      .mocked(captureAnalytics)
      .mock.calls.filter(([event]) => event === 'catalog_search').length;
    state.setSearch('Transient');
    expect(state.getSearchAttemptId()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(200);
    state.setSearch('Student');
    expect(state.getSearchAttemptId()).toBe(initialId);
    await vi.advanceTimersByTimeAsync(500);
    expect(
      vi
        .mocked(captureAnalytics)
        .mock.calls.filter(([event]) => event === 'catalog_search'),
    ).toHaveLength(before);
  });

  it('keeps refresh causality through a canceled filter edit and settles one refresh attempt', async () => {
    vi.useFakeTimers();
    stubBrowserLocation('');
    let resolveRefresh: ((result: CatalogResult) => void) | undefined;
    let calls = 0;
    const state = createTestState(() => {
      calls += 1;
      return calls === 1
        ? Promise.resolve(createCatalogResult([DIPLOMA]))
        : new Promise((resolve) => {
            resolveRefresh = resolve;
          });
    });
    await vi.advanceTimersByTimeAsync(0);
    state.setSearch('Student');
    await vi.advanceTimersByTimeAsync(500);
    const previousId = state.getSearchAttemptId();
    expect(previousId).toEqual(expect.any(String));
    const before = vi
      .mocked(captureAnalytics)
      .mock.calls.filter(([event]) => event === 'catalog_search').length;

    const refresh = state.refetchDiplomas();
    await Promise.resolve();
    expect(state.getSearchAttemptId()).toBeUndefined();
    resolveRefresh?.(createCatalogResult([DIPLOMA]));
    await refresh;
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(200);
    state.setStatusFilter('Transient filter');
    expect(state.getSearchAttemptId()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(100);
    state.setStatusFilter('');
    expect(state.getSearchAttemptId()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(499);
    expect(
      vi
        .mocked(captureAnalytics)
        .mock.calls.filter(([event]) => event === 'catalog_search'),
    ).toHaveLength(before);
    await vi.advanceTimersByTimeAsync(1);

    const searches = vi
      .mocked(captureAnalytics)
      .mock.calls.filter(([event]) => event === 'catalog_search');
    expect(searches).toHaveLength(before + 1);
    expect(searches.at(-1)?.[1]).toMatchObject({ trigger: 'data_refresh' });
    expect(state.getSearchAttemptId()).not.toBe(previousId);
    expect(state.getSearchAttemptId()).toBe(
      searches.at(-1)?.[1]['search_attempt_id'],
    );

    state.setStatusFilter('Settled filter');
    expect(state.getSearchAttemptId()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(500);
    const filteredSearches = vi
      .mocked(captureAnalytics)
      .mock.calls.filter(([event]) => event === 'catalog_search');
    expect(filteredSearches).toHaveLength(before + 2);
    expect(filteredSearches.at(-1)?.[1]).toMatchObject({
      trigger: 'filter_change',
    });
    expect(state.getSearchAttemptId()).toBe(
      filteredSearches.at(-1)?.[1]['search_attempt_id'],
    );
  });

  it.each([
    { kind: 'query', trigger: 'query_edit' },
    { kind: 'filter', trigger: 'filter_change' },
    { kind: 'sort', trigger: 'sort_change' },
  ])(
    'restarts refresh debounce after a late $kind edit',
    async ({ kind, trigger }) => {
      vi.useFakeTimers();
      stubBrowserLocation('');
      let resolveRefresh: ((result: CatalogResult) => void) | undefined;
      let calls = 0;
      const state = createTestState(() => {
        calls += 1;
        return calls === 1
          ? Promise.resolve(createCatalogResult([DIPLOMA]))
          : new Promise((resolve) => {
              resolveRefresh = resolve;
            });
      });
      await vi.advanceTimersByTimeAsync(0);
      state.setSearch('Student');
      await vi.advanceTimersByTimeAsync(500);
      const priorId = state.getSearchAttemptId();
      expect(priorId).toEqual(expect.any(String));
      const searchesBeforeRefresh = vi
        .mocked(captureAnalytics)
        .mock.calls.filter(([event]) => event === 'catalog_search').length;

      const refresh = state.refetchDiplomas();
      await Promise.resolve();
      resolveRefresh?.(createCatalogResult([DIPLOMA]));
      await refresh;
      await vi.advanceTimersByTimeAsync(490);
      if (kind === 'query') state.setSearch('Stud');
      else if (kind === 'filter') state.setStatusFilter('Transient filter');
      else state.handleSort('mentor');
      expect(state.getSearchAttemptId()).toBeUndefined();
      await vi.advanceTimersByTimeAsync(10);
      expect(
        vi
          .mocked(captureAnalytics)
          .mock.calls.filter(([event]) => event === 'catalog_search'),
      ).toHaveLength(searchesBeforeRefresh);
      await vi.advanceTimersByTimeAsync(489);
      expect(
        vi
          .mocked(captureAnalytics)
          .mock.calls.filter(([event]) => event === 'catalog_search'),
      ).toHaveLength(searchesBeforeRefresh);
      await vi.advanceTimersByTimeAsync(1);

      const searches = vi
        .mocked(captureAnalytics)
        .mock.calls.filter(([event]) => event === 'catalog_search');
      expect(searches).toHaveLength(searchesBeforeRefresh + 1);
      expect(searches.at(-1)?.[1]).toMatchObject({ trigger });
      expect(state.getSearchAttemptId()).not.toBe(priorId);
      expect(state.getSearchAttemptId()).toBe(
        searches.at(-1)?.[1]['search_attempt_id'],
      );
      await vi.advanceTimersByTimeAsync(500);
      expect(
        vi
          .mocked(captureAnalytics)
          .mock.calls.filter(([event]) => event === 'catalog_search'),
      ).toHaveLength(searchesBeforeRefresh + 1);
    },
  );

  it('preserves the selected mentor through an initial failure and retry', async () => {
    // Given
    stubBrowserLocation('?mentor=Mentor');
    const fetchTheses = vi
      .fn<() => Promise<CatalogResult>>()
      .mockRejectedValueOnce(new Error('Catalog unavailable'))
      .mockResolvedValueOnce(createCatalogResult([DIPLOMA]));
    const state = createTestState(fetchTheses);
    await Promise.resolve();
    await Promise.resolve();

    // When
    await state.refetchDiplomas();

    // Then
    expect(state.expandedMentor()).toBe('Mentor');
    expect(fetchTheses).toHaveBeenCalledTimes(2);
  });

  it('reports only the latest overlapping load and suppresses completion after cleanup', async () => {
    stubBrowserLocation('');
    const pending: Array<(result: CatalogResult) => void> = [];
    const state = createTestState(
      () =>
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    );
    await Promise.resolve();
    expect(pending).toHaveLength(1);

    const retry = state.refetchDiplomas();
    await Promise.resolve();
    expect(pending).toHaveLength(2);
    pending[0]?.(createCatalogResult([DIPLOMA]));
    await Promise.resolve();
    expect(captureAnalytics).not.toHaveBeenCalledWith(
      'catalog_load_result',
      expect.anything(),
    );
    pending[1]?.(createCatalogResult([DIPLOMA], { stale: true }));
    await retry;
    expect(captureAnalytics).toHaveBeenCalledTimes(1);
    expect(captureAnalytics).toHaveBeenCalledWith('catalog_load_result', {
      outcome: 'stale',
      section: 'diplomas',
      trigger: 'retry',
    });

    const cleanedUp = createTestState(
      () =>
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    );
    await Promise.resolve();
    const count = vi.mocked(captureAnalytics).mock.calls.length;
    cleanedUp.dispose();
    pending[2]?.(createCatalogResult([]));
    await Promise.resolve();
    expect(captureAnalytics).toHaveBeenCalledTimes(count);
  });
});
