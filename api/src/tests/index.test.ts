import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CasAuthentication, Service } from 'finki-auth';
import { CookieJar } from 'tough-cookie';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { isAuthenticated, parseDiplomas } from '../utils.js';

const hasCredentials = () => {
  const username = process.env.CAS_USERNAME;
  const password = process.env.CAS_PASSWORD;

  return Boolean(username && password);
};

const getCredentials = () => {
  const username = process.env.CAS_USERNAME;
  const password = process.env.CAS_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'CAS_USERNAME and CAS_PASSWORD environment variables must be set',
    );
  }

  return { password, username };
};

describe('Diplomas E2E', () => {
  it.skipIf(!hasCredentials())(
    'should fetch and parse real diploma data with non-empty fields',
    { timeout: 30_000 },
    async () => {
      const auth = new CasAuthentication(getCredentials());

      await auth.authenticate(Service.DIPLOMAS);
      const cookies = await auth.getCookie(Service.DIPLOMAS);

      const jar = new CookieJar();

      for (const cookie of cookies) {
        await jar.setCookie(cookie, 'http://diplomski.finki.ukim.mk');
      }

      const client = wrapper(axios.create({ jar }));

      const response = await client.get(
        'http://diplomski.finki.ukim.mk/DiplomaList',
      );

      const html = z.string().parse(response.data);

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
