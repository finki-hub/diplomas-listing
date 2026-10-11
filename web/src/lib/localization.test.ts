import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';

import type { Diploma } from '@/types';

import { getInitialMentorsPageState } from '@/features/mentors/query-state';
import { buildFilteredSummaries } from '@/features/mentors/selectors';
import {
  aggregateByMentor,
  displayName,
  normalizeSearchText,
  transliterateToLatin,
} from '@/features/mentors/utils';

import {
  formatNumber,
  formatPercentage,
  formatThesisDate,
  formatUpdatedAt,
} from './format';
import { interpolate, isLanguage, languageNames, translations } from './i18n';
import { localizeHtml, updatePageMetadata } from './page-metadata';
import { readBrowserStorage, writeBrowserStorage } from './safe-storage';
import { statusTranslations } from './status-catalog';
import { getStatusLabel, matchesStatusSearch } from './statuses';

const STATUS_NUMBER_REGEX = /^\d+\./u;

const thesis: Diploma = {
  dateOfSubmission: '03.07.2026',
  description: 'Оригинален опис',
  fileId: null,
  member1: '',
  member2: '',
  mentor: 'Ѓорѓи Ќосев',
  status: 'Одбрана',
  student: '123456 - Љупчо Шарев',
  title: 'Оригинален наслов',
};

describe('localization', () => {
  it('reads the destination route state instead of the previous section URL', () => {
    vi.stubGlobal('location', { search: '?q=old&status=old&mentor=old' });
    try {
      const state = getInitialMentorsPageState('');
      expect(state.search).toBe('');
      expect(state.statusFilter).toBe('');
      expect(state.expandedMentor).toBeNull();
      expect(getInitialMentorsPageState('?q=Savunma').search).toBe('Savunma');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('accepts exactly the supported stored languages', () => {
    expect(Object.keys(languageNames)).toEqual(Object.keys(translations));
    for (const language of ['mk', 'en', 'sq', 'tr'])
      expect(isLanguage(language)).toBe(true);
    for (const language of [null, '', 'EN', 'de', 'constructor', '__proto__'])
      expect(isLanguage(language)).toBe(false);
  });

  it('keeps all sentence placeholders in each language', () => {
    for (const t of Object.values(translations)) {
      expect(
        interpolate(t.mentorsResults, { shown: '1', total: '2' }),
      ).not.toContain('{');
      for (const section of Object.values(t.sections)) {
        const text = interpolate(section.results, { shown: '1', total: '2' });
        expect(text).toContain('1');
        expect(text).toContain('2');
        expect(text).not.toContain('{');
      }
      expect(interpolate(t.lastUpdated, { date: 'test date' })).toContain(
        'test date',
      );
      expect(interpolate(t.staleUpdated, { date: 'test date' })).toContain(
        'test date',
      );
    }
  });

  it('transliterates names while preserving case, Latin spelling and student indexes', () => {
    expect(transliterateToLatin('Ѓорѓи Ќосев')).toBe('Gjorgji Kjosev');
    expect(transliterateToLatin('ЉУПЧО Џ. ШАРЕВ')).toBe('LJUPCHO DZH. SHAREV');
    expect(displayName(thesis.student, 'en')).toBe('123456 - Ljupcho Sharev');
    expect(displayName('Ömer Çelik / Arben Gashi', 'tr')).toBe(
      'Ömer Çelik / Arben Gashi',
    );
    expect(displayName(thesis.mentor, 'mk')).toBe(thesis.mentor);
    expect(normalizeSearchText('GJORGJI KJOSEV')).toBe(
      normalizeSearchText(thesis.mentor),
    );
    expect(normalizeSearchText('ONAYI')).toBe(normalizeSearchText('onayı'));
  });

  it('keeps distinct source names separate even when their transliterations coincide', () => {
    const summaries = aggregateByMentor([
      { ...thesis, mentor: 'Иван' },
      { ...thesis, mentor: 'Ivan' },
    ]);
    expect(summaries).toHaveLength(2);
    expect(
      summaries.map((summary) => displayName(summary.mentor, 'en')),
    ).toEqual(['Ivan', 'Ivan']);
  });

  it('translates known statuses, preserves source wording in Macedonian and falls back for unknown statuses', () => {
    expect(getStatusLabel('Одбрана', 'diplomas', 'en')).toBe('Defense');
    expect(getStatusLabel('Одбрана', 'diplomas', 'sq')).toBe('Mbrojtja');
    expect(getStatusLabel('Одбрана', 'diplomas', 'tr')).toBe('Savunma');
    const status = '24. Магистерската е завршена.';
    expect(getStatusLabel(status, 'masters', 'en')).toBe(
      '24. The master’s thesis is complete.',
    );
    expect(getStatusLabel(status, 'masters', 'mk')).toBe(status);
    expect(getStatusLabel('24. Нов непознат чекор.', 'masters', 'en')).toBe(
      '24. Нов непознат чекор.',
    );
    expect(getStatusLabel('Одбрана', 'masters', 'en')).toBe('Одбрана');
  });

  it('provides searchable translations for every known source status', () => {
    for (const section of ['diplomas', 'masters'] as const) {
      const entries = Object.entries(statusTranslations[section]);
      for (const [source, labels] of entries) {
        expect(getStatusLabel(source, section, 'mk')).toBe(source);
        for (const language of ['en', 'sq', 'tr'] as const) {
          expect(labels[language]).not.toBe(source);
          expect(
            matchesStatusSearch(
              source,
              section,
              normalizeSearchText(labels[language]),
            ),
          ).toBe(true);
          expect(STATUS_NUMBER_REGEX.exec(labels[language])?.[0]).toBe(
            STATUS_NUMBER_REGEX.exec(source)?.[0],
          );
        }
      }
    }
  });

  it('searches translated statuses in any language while retaining raw filters and thesis content', () => {
    for (const language of ['mk', 'en', 'sq', 'tr'] as const) {
      const results = buildFilteredSummaries({
        language,
        query: 'Savunma',
        section: 'diplomas',
        selectedStatus: 'Одбрана',
        selectedYear: '2026',
        sortDirection: 'asc',
        sortField: 'mentor',
        summaries: aggregateByMentor([thesis]),
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.mentor).toBe(thesis.mentor);
      expect(results[0]?.filteredDiplomas[0]).toEqual(thesis);
    }
  });

  it('formats numbers, percentages and dates without shifting date-only values', () => {
    expect(formatNumber(1_234.5, 'en')).toBe('1,234.5');
    expect(formatNumber(1_234.5, 'tr')).toBe('1.234,5');
    expect(formatPercentage(55, 'en')).toBe('55.0%');
    expect(formatPercentage(55, 'tr')).toBe('%55,0');
    expect(formatThesisDate('03.07.2026', 'en')).toBe('03/07/2026');
    expect(formatThesisDate('03.07.2026', 'tr')).toBe('03.07.2026');
    expect(formatThesisDate('31.02.2026', 'en')).toBe('31.02.2026');
    expect(formatThesisDate('', 'en')).toBe('\u{2014}');
    expect(formatUpdatedAt('invalid date', 'en')).toBe('invalid date');
  });

  it('renders Macedonian metadata in HTML before JavaScript runs', async () => {
    const source = await readFile('index.html', 'utf8');
    const html = localizeHtml(source);
    expect(html).toContain('<html lang="mk">');
    expect(html).toContain(
      `<title>${translations.mk.sections.diplomas.headerTitle}</title>`,
    );
    expect(html).not.toContain('__LOCALIZED_');
    expect(html).toContain(
      '<link rel="canonical" href="https://theses.finki-hub.com/" />',
    );
    expect(html).toContain(
      'content="https://theses.finki-hub.com/favicon-96x96.png"',
    );
  });

  it('updates document and social metadata for the selected section and language', () => {
    const tags = new Map<string, string>();
    const page = {
      documentElement: { lang: 'mk' },
      head: {
        querySelector: (selector: string) => ({
          setAttribute: (_name: string, value: string) =>
            tags.set(selector, value),
        }),
      },
      title: '',
    };
    updatePageMetadata('sq', 'masters', page as unknown as Document);
    expect(page.documentElement.lang).toBe('sq');
    expect(page.title).toBe(translations.sq.sections.masters.headerTitle);
    expect(tags.get('meta[property="og:locale"]')).toBe('sq_AL');
    expect(tags.get('meta[name="description"]')).toBe(
      translations.sq.sections.masters.metadataDescription,
    );
    expect(tags.get('meta[property="og:url"]')).toBe(
      'https://theses.finki-hub.com/masters',
    );
    expect(tags.get('link[rel="canonical"]')).toBe(
      'https://theses.finki-hub.com/masters',
    );
    updatePageMetadata('en', 'diplomas', page as unknown as Document);
    expect(tags.get('meta[property="og:url"]')).toBe(
      'https://theses.finki-hub.com/',
    );
    expect(tags.get('link[rel="canonical"]')).toBe(
      'https://theses.finki-hub.com/',
    );
  });

  it('continues when browser storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Blocked');
      },
      setItem: () => {
        throw new Error('Blocked');
      },
    });
    try {
      expect(readBrowserStorage('finki-hub-lang')).toBeNull();
      expect(writeBrowserStorage('finki-hub-lang', 'sq')).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
