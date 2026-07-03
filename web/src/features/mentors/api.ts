import {
  type Diploma,
  diplomasResponseSchema,
  mastersResponseSchema,
} from '@/types';

import { DIPLOMAS_LIST_URL, MASTERS_LIST_URL } from './constants';

export const fetchDiplomas = async (): Promise<Diploma[]> => {
  const response = await fetch(DIPLOMAS_LIST_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch diplomas');
  }

  return diplomasResponseSchema.parse(await response.json());
};

// Master theses are normalized into the Diploma shape so the rest of the app
// works with a single type. They have no downloadable files (fileId: null).
export const fetchMasterTheses = async (): Promise<Diploma[]> => {
  const response = await fetch(MASTERS_LIST_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch master theses');
  }

  return mastersResponseSchema.parse(await response.json()).map((thesis) => ({
    dateOfSubmission: thesis.dateOfPresentation,
    description: thesis.description,
    fileId: null,
    member1: thesis.president,
    member2: thesis.member,
    mentor: thesis.mentor,
    status: thesis.status,
    student: thesis.student,
    title: thesis.title,
  }));
};
