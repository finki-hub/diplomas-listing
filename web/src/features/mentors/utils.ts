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

  return Array.from(mentorMap.entries())
    .map(([mentor, mentorDiplomas]) => ({
      diplomas: mentorDiplomas,
      mentor,
      totalDiplomas: mentorDiplomas.length,
    }))
    .sort((a, b) => b.totalDiplomas - a.totalDiplomas);
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
