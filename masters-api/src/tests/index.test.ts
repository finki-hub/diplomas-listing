import { describe, expect, it } from 'vitest';

import { AuthManager } from '../auth.js';
import { fetchMastersListPage } from '../fetch.js';
import { parseMasterTheses } from '../utils.js';

const ACADEMIC_TITLE_PREFIX_REGEX =
  /^(?:(?:ред|вонр|проф|доц|ас{2}|асист|акад)\.?|д-р|м-р)\s/iu;
const DATE_ONLY_REGEX = /^(?:\d{1,2}\.\d{1,2}\.\d{4})?$/u;
const STUDENT_FORMAT_REGEX = /^\d+ - /u;

const getCredentials = (): null | { password: string; username: string } => {
  const username = process.env.CAS_USERNAME;
  const password = process.env.CAS_PASSWORD;

  if (!username || !password) return null;

  return { password, username };
};

describe('Masters E2E', () => {
  it('defines credential lookup for optional e2e tests', () => {
    expect(typeof getCredentials).toBe('function');
  });

  it.skipIf(!getCredentials())(
    'should fetch and parse real master thesis data with non-empty fields',
    { timeout: 30_000 },
    async () => {
      const credentials = getCredentials();
      if (!credentials) return;

      const { password, username } = credentials;

      const authManager = new AuthManager(username, password);
      const listResponse = await fetchMastersListPage(authManager, 1);

      expect(listResponse.ok).toBe(true);

      const listHtml = await listResponse.text();

      expect(listHtml.length).toBeGreaterThan(0);

      const theses = parseMasterTheses(listHtml);

      expect(theses.length).toBeGreaterThan(0);

      for (const thesis of theses) {
        expect(thesis.title, 'title should not be empty').not.toBe('');
        expect(thesis.student, 'student should not be empty').not.toBe('');
        expect(thesis.mentor, 'mentor should not be empty').not.toBe('');

        expect(thesis.student, 'student should be "index - name"').toMatch(
          STUDENT_FORMAT_REGEX,
        );

        expect(
          thesis.mentor,
          'mentor should have no academic title prefix',
        ).not.toMatch(ACADEMIC_TITLE_PREFIX_REGEX);
        expect(
          thesis.president,
          'president should have no academic title prefix',
        ).not.toMatch(ACADEMIC_TITLE_PREFIX_REGEX);
        expect(
          thesis.member,
          'member should have no academic title prefix',
        ).not.toMatch(ACADEMIC_TITLE_PREFIX_REGEX);

        expect(
          thesis.dateOfPresentation,
          'dateOfPresentation should be a bare date without a time',
        ).toMatch(DATE_ONLY_REGEX);
        expect(typeof thesis.status).toBe('string');
        expect(typeof thesis.description).toBe('string');
      }
    },
  );
});
