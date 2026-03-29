import { assert, describe, expect, it } from 'vitest';

import { AuthManager } from '../auth.js';
import { fetchDiplomaFile, fetchDiplomaList } from '../fetch.js';
import { parseDiplomas } from '../utils.js';

const getCredentials = (): null | { password: string; username: string } => {
  const username = process.env.CAS_USERNAME;
  const password = process.env.CAS_PASSWORD;

  if (!username || !password) return null;

  return { password, username };
};

describe('Diplomas E2E', () => {
  it.skipIf(!getCredentials())(
    'should fetch and parse real diploma data with non-empty fields',
    { timeout: 30_000 },
    async () => {
      const credentials = getCredentials();
      if (!credentials) return;

      const { password, username } = credentials;

      const authManager = new AuthManager(username, password);
      const diplomasResponse = await fetchDiplomaList(authManager);

      expect(diplomasResponse.ok).toBe(true);

      const diplomasHtml = await diplomasResponse.text();

      expect(diplomasHtml.length).toBeGreaterThan(0);

      const diplomas = parseDiplomas(diplomasHtml);

      expect(diplomas.length).toBeGreaterThan(0);

      for (const diploma of diplomas) {
        expect(diploma.title, 'title should not be empty').not.toBe('');
        expect(diploma.student, 'student should not be empty').not.toBe('');
        expect(diploma.mentor, 'mentor should not be empty').not.toBe('');

        expect(typeof diploma.member1).toBe('string');
        expect(typeof diploma.member2).toBe('string');
        expect(typeof diploma.dateOfSubmission).toBe('string');
        expect(typeof diploma.status).toBe('string');
        expect(typeof diploma.description).toBe('string');

        expect(
          diploma.fileId === null || typeof diploma.fileId === 'string',
          'fileId should be null or a string',
        ).toBe(true);

        if (diploma.fileId !== null) {
          expect(diploma.fileId, 'fileId should contain only digits').toMatch(
            /^\d+$/u,
          );
        }
      }
    },
  );

  it.skipIf(!getCredentials())(
    'should successfully fetch a real diploma file',
    { timeout: 30_000 },
    async () => {
      const credentials = getCredentials();
      if (!credentials) return;

      const authManager = new AuthManager(
        credentials.username,
        credentials.password,
      );

      const diplomasResponse = await fetchDiplomaList(authManager);

      expect(diplomasResponse.ok).toBe(true);

      const diplomasHtml = await diplomasResponse.text();
      const diplomas = parseDiplomas(diplomasHtml);

      expect(diplomas.length).toBeGreaterThan(0);

      const firstDiploma = diplomas.find((d) => d.fileId !== null);
      assert(firstDiploma?.fileId, 'No diploma with fileId found');

      const testId = firstDiploma.fileId;

      expect(testId, 'fileId should contain only digits').toMatch(/^\d+$/u);

      const fileResponse = await fetchDiplomaFile(authManager, testId);

      expect(fileResponse.ok).toBe(true);
      expect(fileResponse.status).toBe(200);

      const contentType = fileResponse.headers.get('Content-Type');

      expect(contentType).not.toBe(null);
      expect(contentType).toMatch(
        /application\/octet-stream|application\/pdf/iu,
      );

      const contentLength = fileResponse.headers.get('Content-Length');

      if (contentLength !== null) {
        expect(Number(contentLength)).toBeGreaterThan(0);
      }

      const blob = await fileResponse.blob();

      expect(blob.size, 'file should not be empty').toBeGreaterThan(0);
    },
  );
});
