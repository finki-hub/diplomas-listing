import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Diploma } from '@/types';

import { fetchDiplomas } from './api';

const DIPLOMA: Diploma = {
  dateOfSubmission: '13.09.2026',
  description: 'Description',
  fileId: null,
  member1: 'Member one',
  member2: 'Member two',
  mentor: 'Mentor',
  status: 'Одбран',
  student: 'Student',
  title: 'Retained diploma',
};

describe('catalog API metadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves retained response freshness metadata', async () => {
    // Given
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          Response.json([DIPLOMA], {
            headers: {
              'X-Data-Stale': 'true',
              'X-Data-Updated-At': '2026-09-10T08:30:00.000Z',
            },
          }),
        ),
      ),
    );

    // When
    const result = await fetchDiplomas();

    // Then
    expect(result).toEqual({
      items: [DIPLOMA],
      stale: true,
      updatedAt: '2026-09-10T08:30:00.000Z',
    });
  });
});
