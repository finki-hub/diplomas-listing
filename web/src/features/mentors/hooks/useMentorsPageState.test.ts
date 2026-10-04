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

    // When
    await state.refetchDiplomas();

    // Then
    expect(state.diplomas.state).toBe('ready');
    expect(state.diplomas()).toEqual([DIPLOMA]);
    expect(state.loadError()).toBe(null);
    expect(fetchTheses).toHaveBeenCalledTimes(3);
  });

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
});
