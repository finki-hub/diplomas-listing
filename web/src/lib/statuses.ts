import type { SectionId } from '@/features/mentors/section';

import { normalizeSearchText } from '@/features/mentors/utils';

import type { Language } from './i18n';

import { statusTranslations } from './status-catalog';

const WHITESPACE_REGEX = /\s+/gu;
const TRAILING_PERIOD_REGEX = /\.$/u;

const normalizeStatus = (status: string): string =>
  status
    .trim()
    .toLowerCase()
    .replaceAll(WHITESPACE_REGEX, ' ')
    .replace(TRAILING_PERIOD_REGEX, '');

const makeLookup = (section: SectionId) =>
  new Map(
    Object.entries(statusTranslations[section]).map(([source, labels]) => [
      normalizeStatus(source),
      {
        labels,
        search: [source, ...Object.values(labels)].map(normalizeSearchText),
      },
    ]),
  );

const lookups = {
  diplomas: makeLookup('diplomas'),
  masters: makeLookup('masters'),
};

export const getStatusLabel = (
  status: string,
  section: SectionId,
  language: Language,
): string => {
  if (language === 'mk') return status;
  return (
    lookups[section].get(normalizeStatus(status))?.labels[language] ?? status
  );
};

export const matchesStatusSearch = (
  status: string,
  section: SectionId,
  query: string,
): boolean =>
  (
    lookups[section].get(normalizeStatus(status))?.search ?? [
      normalizeSearchText(status),
    ]
  ).some((value) => value.includes(query));
