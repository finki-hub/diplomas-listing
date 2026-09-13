import { createRoot } from 'solid-js';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import type { Diploma } from '@/types';

import type { SectionConfig } from '../section';

import { useMentorsPageState } from './useMentorsPageState';

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

describe('useMentorsPageState', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries the failed catalog request when requested', async () => {
    // Given
    vi.stubGlobal('location', { pathname: '/', search: '' });
    vi.stubGlobal('history', { replaceState: vi.fn() });
    const fetchTheses = vi
      .fn<() => Promise<Diploma[]>>()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('Catalog unavailable'))
      .mockResolvedValueOnce([DIPLOMA]);
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
});
