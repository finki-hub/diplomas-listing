type Diploma = {
  dateOfSubmission: string;
  description: string;
  fileUrl: null | string;
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

const stripTags = (html: string): string =>
  // eslint-disable-next-line regexp/no-super-linear-move
  html.replaceAll(/<[^>]*>/gu, '').trim();

const parseTableRows = (panel: string): TableRow[] => {
  const rows: TableRow[] = [];

  for (const rowMatch of panel.matchAll(ROW_REGEX)) {
    const row = rowMatch.groups?.content ?? '';
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

export const isAuthenticated = (html: string): boolean =>
  html.includes('Датум на пријавување') || !html.includes('Датум на одбрана');

const getByLabel = (rows: TableRow[], label: string): string => {
  const row = findRowByLabel(rows, label);
  if (!row) return '';

  const strongMatch = /<strong>(?<text>[\s\S]*?)<\/strong>/iu.exec(
    row.valueCell,
  );

  return strongMatch?.groups?.text ? stripTags(strongMatch.groups.text) : '';
};

const getFileUrl = (rows: TableRow[], url: string): null | string => {
  const row = findRowByLabel(rows, 'Датотека');
  if (!row) return null;

  const hrefMatch = /<a[^>]*href="(?<url>[^"]*)"[^>]*>/iu.exec(row.valueCell);

  if (
    hrefMatch?.groups?.url &&
    // eslint-disable-next-line no-script-url
    hrefMatch.groups.url !== 'javascript:void(0)'
  ) {
    return new URL(hrefMatch.groups.url, url).href;
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

export const parseDiplomas = (html: string, url: string): Diploma[] => {
  const panelStarts = findPanelStartIndices(html);

  return panelStarts.map((start, i) => {
    const end = i + 1 < panelStarts.length ? panelStarts[i + 1] : html.length;
    const panel = html.slice(start, end);
    const rows = parseTableRows(panel);

    const headingMatch =
      /class="[^"]*panel-heading[^"]*"[^>]*>(?<heading>[\s\S]*?)<\/div>/iu.exec(
        panel,
      );
    const title = headingMatch?.groups?.heading
      ? stripTags(headingMatch.groups.heading)
      : '';

    return {
      dateOfSubmission: getByLabel(rows, 'Датум на пријавување'),
      description: getByLabel(rows, 'Краток опис'),
      fileUrl: getFileUrl(rows, url),
      member1: getByLabel(rows, 'Член 1'),
      member2: getByLabel(rows, 'Член 2'),
      mentor: getByLabel(rows, 'Ментор'),
      status: getByLabel(rows, 'Статус'),
      student: getByLabel(rows, 'Студент'),
      title,
    };
  });
};
