import { type Diploma, diplomasResponseSchema } from '@/types';

import { API_URL } from './constants';

export const fetchDiplomas = async (): Promise<Diploma[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch diplomas');
  }

  return diplomasResponseSchema.parse(await response.json());
};
