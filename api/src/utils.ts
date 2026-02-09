import { load } from 'cheerio';

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
  const $ = load(html);
  const diplomas: Diploma[] = [];

  $('div.panel').each((_, card) => {
    const title = $(card).find('.panel-heading').text().trim();

    const getByLabel = (label: string): string => {
      let value = '';

      $(card)
        .find('table tr')
        .each((__, row) => {
          const labelCell = $(row).find('td:nth-child(1)');

          if (labelCell.text().includes(label)) {
            value = $(row).find('td:nth-child(2) strong').text().trim();
          }
        });

      return value;
    };

    const getFileUrl = (): null | string => {
      let url: null | string = null;

      $(card)
        .find('table tr')
        .each((__, row) => {
          const labelCell = $(row).find('td:nth-child(1)');

          if (labelCell.text().includes('Датотека')) {
            const href = $(row).find('td:nth-child(2) strong a').attr('href');

            // eslint-disable-next-line no-script-url
            url = href && href !== 'javascript:void(0)' ? href : null;
          }
        });

      return url;
    };

    diplomas.push({
      dateOfSubmission: getByLabel('Датум на пријавување'),
      description: getByLabel('Краток опис'),
      fileUrl: getFileUrl(),
      member1: getByLabel('Член 1'),
      member2: getByLabel('Член 2'),
      mentor: getByLabel('Ментор'),
      status: getByLabel('Статус'),
      student: getByLabel('Студент'),
      title,
    });
  });

  return diplomas;
};
