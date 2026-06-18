import type { ValidationTargets } from 'hono';
import type { ZodType } from 'zod';

import { zValidator } from '@hono/zod-validator';

type Diploma = {
  dateOfSubmission: string;
  description: string;
  fileId: null | string;
  member1: string;
  member2: string;
  mentor: string;
  status: string;
  student: string;
  title: string;
};

type TableRow = {
  labelCell: string;
  valueCell: string;
};

const ROW_REGEX = /<tr[^>]*>(?<content>[\s\S]*?)<\/tr>/giu;
const CELL_REGEX = /<td[^>]*>(?<cell>[\s\S]*?)<\/td>/giu;
const STRONG_REGEX = /<strong>(?<text>[\s\S]*?)<\/strong>/iu;
const HREF_REGEX = /<a[^>]*href="(?<url>[^"]*)"[^>]*>/iu;
const HEADING_REGEX =
  /class="[^"]*panel-heading[^"]*"[^>]*>(?<heading>[\s\S]*?)<\/div>/iu;
const JAVASCRIPT_VOID_URL = ['javascript', 'void(0)'].join(':');

const stripTags = (html: string): string => {
  let text = '';
  let insideTag = false;

  for (const char of html) {
    if (char === '<') {
      insideTag = true;
    } else if (char === '>') {
      insideTag = false;
    } else if (!insideTag) {
      text += char;
    }
  }

  return text.trim();
};

const parseTableRows = (panel: string): TableRow[] => {
  const rows: TableRow[] = [];

  for (const rowMatch of panel.matchAll(ROW_REGEX)) {
    const row = rowMatch.groups?.content ?? '';
    // eslint-disable-next-line unicorn/prefer-iterator-to-array -- Iterator#toArray() defeats eslint-plugin-regexp's named-group tracing, triggering a false `no-unused-capturing-group` for `cell`.
    const cells = [...row.matchAll(CELL_REGEX)];

    if (cells.length >= 2) {
      rows.push({
        labelCell: cells[0]?.groups?.cell ?? '',
        valueCell: cells[1]?.groups?.cell ?? '',
      });
    }
  }

  return rows;
};

const findRowByLabel = (
  rows: TableRow[],
  label: string,
): TableRow | undefined =>
  rows.find((row) => stripTags(row.labelCell).includes(label));

const getByLabel = (rows: TableRow[], label: string): string => {
  const row = findRowByLabel(rows, label);
  if (!row) return '';

  const strongMatch = STRONG_REGEX.exec(row.valueCell);

  return strongMatch?.groups?.text ? stripTags(strongMatch.groups.text) : '';
};

const getFileId = (rows: TableRow[]): null | string => {
  const row = findRowByLabel(rows, 'Датотека');
  if (!row) return null;

  const hrefMatch = HREF_REGEX.exec(row.valueCell);

  if (hrefMatch?.groups?.url && hrefMatch.groups.url !== JAVASCRIPT_VOID_URL) {
    return hrefMatch.groups.url.split('/').pop() ?? null;
  }

  return null;
};

const PANEL_MARKER = 'class="panel ';

const findPanelStartIndices = (html: string): number[] => {
  const indices: number[] = [];
  let searchFrom = 0;

  for (;;) {
    const idx = html.indexOf(PANEL_MARKER, searchFrom);
    if (idx === -1) break;

    const divStart = html.lastIndexOf('<div', idx);
    if (divStart !== -1) {
      indices.push(divStart);
    }

    searchFrom = idx + PANEL_MARKER.length;
  }

  return indices;
};

export const parseDiplomas = (html: string): Diploma[] => {
  const panelStarts = findPanelStartIndices(html);

  return panelStarts.map((start, i) => {
    const end = panelStarts[i + 1] ?? html.length;
    const panel = html.slice(start, end);
    const rows = parseTableRows(panel);

    const headingMatch = HEADING_REGEX.exec(panel);
    const title = headingMatch?.groups?.heading
      ? stripTags(headingMatch.groups.heading)
      : '';

    return {
      dateOfSubmission: getByLabel(rows, 'Датум на пријавување'),
      description: getByLabel(rows, 'Краток опис'),
      fileId: getFileId(rows),
      member1: getByLabel(rows, 'Член 1'),
      member2: getByLabel(rows, 'Член 2'),
      mentor: getByLabel(rows, 'Ментор'),
      status: getByLabel(rows, 'Статус'),
      student: getByLabel(rows, 'Студент'),
      title,
    };
  });
};

export const validate = <
  Target extends keyof ValidationTargets,
  Schema extends ZodType,
>(
  target: Target,
  schema: Schema,
) =>
  // eslint-disable-next-line sonarjs/no-inconsistent-returns -- zValidator requires returning a response only when validation fails.
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message ?? 'Invalid input';

      return c.json({ error: errorMessage }, 400);
    }

    // eslint-disable-next-line consistent-return, no-useless-return, sonarjs/no-redundant-jump -- Returning no response tells zValidator to continue to the route handler.
    return;
  });
