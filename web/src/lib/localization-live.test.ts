import process from 'node:process';
import { describe, expect, it } from 'vitest';

import type { SectionId } from '@/features/mentors/section';

import { fetchDiplomas, fetchMasterTheses } from '@/features/mentors/api';

import { getStatusLabel } from './statuses';

const BLOCK_BREAK_REGEX = /\r?\n\r?\n/u;
const LINE_BREAK_REGEX = /\r?\n/u;

const expectTranslations = (statuses: string[], section: SectionId): void => {
  expect(statuses.length).toBeGreaterThan(0);
  for (const status of statuses) {
    for (const language of ['en', 'sq', 'tr'] as const) {
      expect(
        getStatusLabel(status, section, language),
        `${section}: ${status} (${language})`,
      ).not.toBe(status);
    }
  }
};

describe.runIf(process.env['LIVE_CATALOG_TESTS'] === '1')(
  'live localization coverage',
  () => {
    it('covers every status in both live API catalogs', async () => {
      const [diplomas, masters] = await Promise.all([
        fetchDiplomas(),
        fetchMasterTheses(),
      ]);
      expectTranslations(
        [...new Set(diplomas.items.map((thesis) => thesis.status))],
        'diplomas',
      );
      expectTranslations(
        [...new Set(masters.items.map((thesis) => thesis.status))],
        'masters',
      );
    }, 30_000);

    it('covers every status declared in the upstream GitLab projects', async () => {
      const files = [
        [128, 'src/main/resources/messages.properties'],
        [
          129,
          'src/main/java/vp/magisterski/model/enumerations/MasterThesisStatus.java',
        ],
      ] as const;
      const [diplomas = '', masters = ''] = await Promise.all(
        files.map(async ([project, path]) => {
          const response = await fetch(
            `https://gitlab.finki.ukim.mk/api/v4/projects/${project}/repository/files/${encodeURIComponent(path)}/raw?ref=dev`,
          );
          expect(response.ok).toBe(true);
          return response.text();
        }),
      );
      const diplomaStatuses =
        diplomas
          .split(BLOCK_BREAK_REGEX, 1)[0]
          ?.split(LINE_BREAK_REGEX)
          .map((line) => line.slice(line.indexOf('=') + 1)) ?? [];
      const masterStatuses = Array.from(
        masters.matchAll(/\b\w+\(\d+,\s*"(?<status>[^"]+)"/gu),
        (match) => match.groups?.['status'] ?? '',
      );
      expect(diplomaStatuses.length).toBeGreaterThanOrEqual(13);
      expect(masterStatuses.length).toBeGreaterThanOrEqual(25);
      expectTranslations(diplomaStatuses, 'diplomas');
      expectTranslations(masterStatuses, 'masters');
    }, 30_000);
  },
);
