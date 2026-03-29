import { type Diploma, diplomasResponseSchema } from '@/types';

import { DIPLOMAS_LIST_URL } from './constants';

export const fetchDiplomas = async (): Promise<Diploma[]> => {
  const response = await fetch(DIPLOMAS_LIST_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch diplomas');
  }

  return diplomasResponseSchema.parse(await response.json());
};
