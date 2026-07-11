import type { Diploma, MentorSummary } from '@/types';

const SUBMISSION_YEAR_REGEX = /^\d{4}$/u;
const WHITESPACE_REGEX = /\s+/u;

export const aggregateByMentor = (diplomas: Diploma[]): MentorSummary[] => {
  const mentorMap = new Map<string, Diploma[]>();

  for (const diploma of diplomas) {
    const mentor = diploma.mentor.trim();
    if (!mentor) continue;

    const existing = mentorMap.get(mentor);
    if (existing) {
      existing.push(diploma);
    } else {
      mentorMap.set(mentor, [diploma]);
    }
  }

  return Array.from(mentorMap, ([mentor, mentorDiplomas]) => ({
    diplomas: mentorDiplomas,
    mentor,
    totalDiplomas: mentorDiplomas.length,
  })).sort((a, b) => b.totalDiplomas - a.totalDiplomas);
};

export const getSubmissionYear = (value: string): null | string => {
  // Masters dates carry a time suffix ("03.07.2026 11:00"); the year lives in
  // the leading date token.
  const datePart = value.trim().split(WHITESPACE_REGEX, 1)[0] ?? '';
  const parts = datePart.split('.').filter(Boolean);
  if (parts.length !== 3) return null;

  const year = parts[2]?.trim();
  if (!year || !SUBMISSION_YEAR_REGEX.test(year)) return null;

  return year;
};

export const createFileUrlGetter =
  (baseUrl: string) =>
  (fileId: null | string): null | string =>
    fileId === null ? null : `${baseUrl}${fileId}`;

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ѓ: 'gj',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  ѕ: 'dz',
  и: 'i',
  ј: 'j',
  к: 'k',
  ќ: 'kj',
  л: 'l',
  љ: 'lj',
  м: 'm',
  н: 'n',
  њ: 'nj',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  џ: 'dzh',
  ш: 'sh',
};

const LATIN_EQUIVALENTS: Array<[string, string]> = [
  ['dž', 'dzh'],
  ['dj', 'gj'],
  ['đ', 'gj'],
  ['ǵ', 'gj'],
  ['kj', 'kj'],
  ['ḱ', 'kj'],
  ['lj', 'lj'],
  ['nj', 'nj'],
  ['zh', 'zh'],
  ['ž', 'zh'],
  ['ch', 'ch'],
  ['č', 'ch'],
  ['sh', 'sh'],
  ['š', 'sh'],
  ['dz', 'dz'],
  ['c', 'c'],
];

const transliterateToLatin = (value: string) => {
  let result = '';

  for (const character of value) {
    result += CYRILLIC_TO_LATIN[character] ?? character;
  }

  return result;
};

const normalizeLatinVariants = (value: string) => {
  let normalized = value;

  for (const [from, to] of LATIN_EQUIVALENTS) {
    normalized = normalized.replaceAll(from, () => to);
  }

  return normalized;
};

export const normalizeSearchText = (value: string) =>
  normalizeLatinVariants(transliterateToLatin(value.toLowerCase()))
    .normalize('NFKD')
    .replaceAll(/\p{Mark}+/gu, '')
    .replaceAll(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replaceAll(/\s+/gu, ' ');

export const matchesNormalizedSearch = (
  value: string,
  normalizedSearch: string,
) => {
  if (!normalizedSearch) return true;

  return normalizeSearchText(value).includes(normalizedSearch);
};
