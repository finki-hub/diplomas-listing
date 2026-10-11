export const DIPLOMAS_LIST_URL = 'https://bachelors-api.finki-hub.com/diplomas';
export const DIPLOMAS_FILE_URL =
  'https://bachelors-api.finki-hub.com/diplomas/download/';
export const MASTERS_LIST_URL = 'https://masters-api.finki-hub.com/masters';
export const MASTERS_FILE_URL =
  'https://masters-api.finki-hub.com/masters/download/';

export const STATUS_STAGES: Array<[string, number]> = [
  ['пријава', 1],
  ['прифаќање', 2],
  ['валидирање од службата', 3],
  ['одобрение од продекан', 4],
  ['одобрение за оценка', 5],
  ['забелешки', 6],
  ['валидирање на услови', 7],
  ['одбран', 8],
  ['архив', 9],
];
