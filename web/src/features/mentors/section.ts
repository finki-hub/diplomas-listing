import type { Diploma } from '@/types';

import { fetchDiplomas, fetchMasterTheses } from './api';
import {
  DIPLOMAS_FILE_URL,
  MASTERS_FILE_URL,
  STATUS_STAGES,
} from './constants';
import { createFileUrlGetter } from './utils';

export type SectionConfig = {
  basePath: string;
  fetchTheses: () => Promise<Diploma[]>;
  getFileUrl: (fileId: null | string) => null | string;
  getStatusStage: (status: string) => null | number;
  id: SectionId;
  maxStatusStage: number;
  strings: SectionStrings;
};

export type SectionId = 'diplomas' | 'masters';

export type SectionStrings = {
  cardDescription: string;
  cardTitle: string;
  countLabel: string;
  headerTitle: string;
  tableCountHeader: string;
  totalThesesLabel: string;
};

const findDiplomaStatusStage = (status: string): null | number => {
  const lower = status.toLowerCase();

  for (const [keyword, stage] of STATUS_STAGES) {
    if (lower.includes(keyword)) {
      return stage;
    }
  }

  return null;
};

// Masters statuses are numbered workflow steps ("12. Архивирање…"); the
// cancelled status carries no number and maps to no stage.
const MASTERS_STATUS_STAGE_REGEX = /^(?<stage>\d+)\./u;

const findMastersStatusStage = (status: string): null | number => {
  const stage = MASTERS_STATUS_STAGE_REGEX.exec(status.trim())?.groups?.[
    'stage'
  ];

  return stage ? Number(stage) : null;
};

export const getStatusOpacity = (
  config: Pick<SectionConfig, 'getStatusStage' | 'maxStatusStage'>,
  status: string,
): number => {
  const stage = config.getStatusStage(status);

  return stage === null ? 0.3 : 0.3 + (stage / config.maxStatusStage) * 0.7;
};

export const DIPLOMAS_SECTION: SectionConfig = {
  basePath: '/',
  fetchTheses: fetchDiplomas,
  getFileUrl: createFileUrlGetter(DIPLOMAS_FILE_URL),
  getStatusStage: findDiplomaStatusStage,
  id: 'diplomas',
  maxStatusStage: 9,
  strings: {
    cardDescription:
      'Преглед на сите ментори и нивните дипломски трудови. Кликнете на ред за да ги видите деталите. Податоците се ажурираат на секој час.',
    cardTitle: 'Ментори и дипломски трудови',
    countLabel: 'дипломски',
    headerTitle: 'ФИНКИ Хаб / Дипломски',
    tableCountHeader: 'Дипломски трудови',
    totalThesesLabel: 'Вкупно дипломски',
  },
};

export const MASTERS_SECTION: SectionConfig = {
  basePath: '/masters',
  fetchTheses: fetchMasterTheses,
  getFileUrl: createFileUrlGetter(MASTERS_FILE_URL),
  getStatusStage: findMastersStatusStage,
  id: 'masters',
  maxStatusStage: 24,
  strings: {
    cardDescription:
      'Преглед на сите ментори и нивните магистерски трудови. Кликнете на ред за да ги видите деталите. Податоците се ажурираат на секој час.',
    cardTitle: 'Ментори и магистерски трудови',
    countLabel: 'магистерски',
    headerTitle: 'ФИНКИ Хаб / Магистерски',
    tableCountHeader: 'Магистерски трудови',
    totalThesesLabel: 'Вкупно магистерски',
  },
};
