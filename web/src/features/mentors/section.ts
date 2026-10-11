import { type CatalogResult, fetchDiplomas, fetchMasterTheses } from './api';
import {
  DIPLOMAS_FILE_URL,
  MASTERS_FILE_URL,
  STATUS_STAGES,
} from './constants';
import { createFileUrlGetter } from './utils';

export type SectionConfig = {
  basePath: string;
  fetchTheses: () => Promise<CatalogResult>;
  getFileUrl: (fileId: null | string) => null | string;
  getStatusStage: (status: string) => null | number;
  id: SectionId;
  maxStatusStage: number;
};

export type SectionId = 'diplomas' | 'masters';

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
};

export const MASTERS_SECTION: SectionConfig = {
  basePath: '/masters',
  fetchTheses: fetchMasterTheses,
  getFileUrl: createFileUrlGetter(MASTERS_FILE_URL),
  getStatusStage: findMastersStatusStage,
  id: 'masters',
  maxStatusStage: 24,
};
