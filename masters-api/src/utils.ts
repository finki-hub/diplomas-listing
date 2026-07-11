export type MasterThesis = {
  dateOfPresentation: string;
  description: string;
  fileId: null | string;
  member: string;
  mentor: string;
  president: string;
  status: string;
  student: string;
  title: string;
};

type TableRow = {
  label: string;
  value: string;
};

const ROW_REGEX = /<tr[^>]*>(?<content>[\s\S]*?)<\/tr>/giu;
const CELL_REGEX = /<td[^>]*>(?<cell>[\s\S]*?)<\/td>/giu;
const TITLE_REGEX = /<h5[^>]*>(?<heading>[\s\S]*?)<\/h5>/iu;
// Download buttons link to ".../master-thesis/download/{fileId}/text".
const DOWNLOAD_HREF_REGEX =
  /href="[^"]*\/master-thesis\/download\/(?<fileId>[^"/]+)\/text"/iu;
const ENTITY_REGEX =
  /&(?:#x(?<hex>[\da-f]+)|#(?<dec>\d+)|(?<named>[a-z]+));/giu;
const MAX_CODE_POINT = 0x10_ff_ff;
const HTML_DELIMITER_REGEX = /[<>]/gu;

// Names come prefixed with academic titles ("вонр. проф. д-р Име Презиме");
// the diplomas listing serves bare names, so strip them for parity.

const ACADEMIC_TITLE_REGEX =
  /^(?:(?:ред|вонр|проф|доц|ас{2}|асист|акад|д-р|м-р)\.?\s+)+/iu;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

const decodeEntities = (value: string): string =>
  value.replaceAll(ENTITY_REGEX, (match, ...args) => {
    const groups = args.at(-1) as {
      dec?: string;
      hex?: string;
      named?: string;
    };

    if (groups.hex !== undefined || groups.dec !== undefined) {
      const codePoint =
        groups.hex === undefined
          ? Number(groups.dec)
          : Number.parseInt(groups.hex, 16);

      return codePoint > 0 && codePoint <= MAX_CODE_POINT
        ? String.fromCodePoint(codePoint)
        : match;
    }

    return NAMED_ENTITIES[groups.named?.toLowerCase() ?? ''] ?? match;
  });

const stripHtmlTags = (html: string): string => {
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

  return text;
};

// Collapsing whitespace also fuses the student cell's separate
// <span>index</span> - <span>name</span> spans into "index - name".
const toText = (html: string): string =>
  decodeEntities(stripHtmlTags(html))
    .replaceAll(HTML_DELIMITER_REGEX, '')
    .replaceAll(/\s+/gu, ' ')
    .trim();

const stripAcademicTitles = (name: string): string =>
  name.replace(ACADEMIC_TITLE_REGEX, '').trim();

// Presentation dates come as "03.07.2026 11:00"; the diplomas listing serves
// bare dates, so drop the time for parity.
const stripTimeOfDay = (value: string): string => value.split(' ', 1)[0] ?? '';

const parseTableRows = (block: string): TableRow[] => {
  const rows: TableRow[] = [];

  for (const rowMatch of block.matchAll(ROW_REGEX)) {
    const row = rowMatch.groups?.content ?? '';
    // eslint-disable-next-line unicorn/prefer-iterator-to-array -- Iterator#toArray() defeats eslint-plugin-regexp's named-group tracing, triggering a false `no-unused-capturing-group` for `cell`.
    const cells = [...row.matchAll(CELL_REGEX)];

    if (cells.length >= 2) {
      rows.push({
        label: toText(cells[0]?.groups?.cell ?? ''),
        value: toText(cells[1]?.groups?.cell ?? ''),
      });
    }
  }

  return rows;
};

const getByLabel = (rows: TableRow[], label: string): string =>
  rows.find((row) => row.label.includes(label))?.value ?? '';

const BLOCK_MARKER = 'class="row rounded border m-4';

const findBlockStartIndices = (html: string): number[] => {
  const indices: number[] = [];
  let searchFrom = 0;

  for (;;) {
    const idx = html.indexOf(BLOCK_MARKER, searchFrom);
    if (idx === -1) break;

    const divStart = html.lastIndexOf('<div', idx);
    if (divStart !== -1) {
      indices.push(divStart);
    }

    searchFrom = idx + BLOCK_MARKER.length;
  }

  return indices;
};

export const parseMasterTheses = (html: string): MasterThesis[] => {
  const blockStarts = findBlockStartIndices(html);

  return blockStarts.map((start, i) => {
    const end = blockStarts[i + 1] ?? html.length;
    const block = html.slice(start, end);
    const rows = parseTableRows(block);

    const titleMatch = TITLE_REGEX.exec(block);
    const title = titleMatch?.groups?.heading
      ? toText(titleMatch.groups.heading)
      : '';

    return {
      dateOfPresentation: stripTimeOfDay(
        getByLabel(rows, 'Датум на презентирање'),
      ),
      description: getByLabel(rows, 'Краток опис'),
      fileId: DOWNLOAD_HREF_REGEX.exec(block)?.groups?.fileId ?? null,
      member: stripAcademicTitles(getByLabel(rows, 'Член')),
      mentor: stripAcademicTitles(getByLabel(rows, 'Ментор')),
      president: stripAcademicTitles(getByLabel(rows, 'Претседател')),
      status: getByLabel(rows, 'Статус'),
      student: getByLabel(rows, 'Студент'),
      title,
    };
  });
};
