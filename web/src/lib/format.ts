import { type Language, languageLocales } from './i18n';

export const formatNumber = (
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions,
): string =>
  new Intl.NumberFormat(languageLocales[language], options).format(value);

export const formatPercentage = (value: number, language: Language): string =>
  formatNumber(value / 100, language, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: 'percent',
  });

const THESIS_DATE_REGEX =
  /^(?<day>\d{1,2})\.(?<month>\d{1,2})\.(?<year>\d{4})\.?$/u;

export const formatThesisDate = (value: string, language: Language): string => {
  if (!value) return '\u{2014}';
  const parts = THESIS_DATE_REGEX.exec(value.trim())?.groups;
  if (!parts) return value;

  const day = Number(parts['day']);
  const month = Number(parts['month']);
  const year = Number(parts['year']);
  // Date-only source values must not move to another day in the browser's zone.
  // eslint-disable-next-line unicorn/prefer-temporal -- Target browsers have no Temporal polyfill.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return value;

  return new Intl.DateTimeFormat(languageLocales[language], {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date);
};

export const formatUpdatedAt = (value: string, language: Language): string => {
  // eslint-disable-next-line unicorn/prefer-temporal -- Target browsers have no Temporal polyfill.
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(languageLocales[language], {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};
