import { z } from 'zod';

import {
  type Diploma,
  diplomasResponseSchema,
  mastersResponseSchema,
} from '@/types';

import { DIPLOMAS_LIST_URL, MASTERS_LIST_URL } from './constants';

const UPDATED_AT_SCHEMA = z.iso.datetime();

export type CatalogResult = {
  readonly items: Diploma[];
  readonly stale: boolean;
  readonly updatedAt: null | string;
};

const getCatalogMetadata = (
  response: Response,
): Pick<CatalogResult, 'stale' | 'updatedAt'> => {
  const updatedAtHeader = response.headers.get('X-Data-Updated-At');
  const updatedAtResult = UPDATED_AT_SCHEMA.safeParse(updatedAtHeader);

  return {
    stale: response.headers.get('X-Data-Stale') === 'true',
    updatedAt: updatedAtResult.success ? updatedAtResult.data : null,
  };
};

export const fetchDiplomas = async (): Promise<CatalogResult> => {
  const response = await fetch(DIPLOMAS_LIST_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch diplomas');
  }

  return {
    items: diplomasResponseSchema.parse(await response.json()),
    ...getCatalogMetadata(response),
  };
};

// Master theses are normalized into the Diploma shape so the rest of the app
// works with a single type.
export const fetchMasterTheses = async (): Promise<CatalogResult> => {
  const response = await fetch(MASTERS_LIST_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch master theses');
  }

  return {
    items: mastersResponseSchema.parse(await response.json()).map((thesis) => ({
      dateOfSubmission: thesis.dateOfPresentation,
      description: thesis.description,
      fileId: thesis.fileId,
      member1: thesis.president,
      member2: thesis.member,
      mentor: thesis.mentor,
      status: thesis.status,
      student: thesis.student,
      title: thesis.title,
    })),
    ...getCatalogMetadata(response),
  };
};
