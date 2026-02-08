import { JSDOM } from 'jsdom';

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

export const isAuthenticated = (html: string): boolean =>
  html.includes('Датум на пријавување') || !html.includes('Датум на одбрана');

export const parseDiplomas = (html: string): Diploma[] => {
  const { window } = new JSDOM(html);
  const document = window.document;

  const cards = document.querySelectorAll('div.panel');

  return Array.from(cards).map((card) => {
    const title =
      card.querySelector('.panel-heading')?.textContent.trim() ?? '';

    const rows = card.querySelectorAll('table tbody tr');

    const getByLabel = (label: string) => {
      for (const row of rows) {
        const labelCell = row.querySelector('td:nth-child(1)');

        if (labelCell?.textContent.includes(label)) {
          return (
            row.querySelector('td:nth-child(2) strong')?.textContent.trim() ??
            ''
          );
        }
      }

      return '';
    };

    const getFileUrl = () => {
      for (const row of rows) {
        const labelCell = row.querySelector('td:nth-child(1)');

        if (labelCell?.textContent.includes('Датотека')) {
          const anchor = row.querySelector('td:nth-child(2) strong a');
          const href = anchor?.getAttribute('href');

          // eslint-disable-next-line no-script-url
          return href && href !== 'javascript:void(0)' ? href : null;
        }
      }

      return null;
    };

    return {
      dateOfSubmission: getByLabel('Датум на пријавување'),
      description: getByLabel('Краток опис'),
      fileUrl: getFileUrl(),
      member1: getByLabel('Член 1'),
      member2: getByLabel('Член 2'),
      mentor: getByLabel('Ментор'),
      status: getByLabel('Статус'),
      student: getByLabel('Студент'),
      title,
    };
  });
};
