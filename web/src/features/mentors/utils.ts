import type { Diploma, MentorSummary } from '@/types';

import { DIPLOMAS_FILE_URL, STATUS_STAGES } from './constants';

const SUBMISSION_YEAR_REGEX = /^\d{4}$/u;

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

const findStatusStage = (status: string): number | undefined => {
  const lower = status.toLowerCase();

  for (const [keyword, stage] of STATUS_STAGES) {
    if (lower.includes(keyword)) {
      return stage;
    }
  }

  return undefined;
};

export const getStatusOpacity = (status: string): number => {
  const stage = findStatusStage(status);

  return stage === undefined ? 0.3 : 0.3 + (stage / 9) * 0.7;
};

export const getStatusStage = (status: string): null | number =>
  findStatusStage(status) ?? null;

export const getSubmissionYear = (value: string): null | string => {
  const parts = value.split('.').filter(Boolean);
  if (parts.length !== 3) return null;

  const year = parts[2]?.trim();
  if (!year || !SUBMISSION_YEAR_REGEX.test(year)) return null;

  return year;
};

export const getDiplomaFileUrl = (fileId: null | string): null | string =>
  fileId === null ? null : `${DIPLOMAS_FILE_URL}${fileId}`;

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
