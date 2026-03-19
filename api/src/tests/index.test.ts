import { describe, expect, it } from 'vitest';

import { authenticateAndFetch } from '../auth.js';
import { isAuthenticated, parseDiplomas } from '../utils.js';

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
      const html = await authenticateAndFetch(username, password);

      expect(html.length).toBeGreaterThan(0);

      expect(
        isAuthenticated(html),
        'should be authenticated — got the public (non-logged-in) page instead',
      ).toBe(true);

      const diplomas = parseDiplomas(html);

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
          diploma.fileUrl === null || typeof diploma.fileUrl === 'string',
          'fileUrl should be null or a string',
        ).toBe(true);
      }
    },
  );
});
