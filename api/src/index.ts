import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CasAuthentication, Service } from 'finki-auth';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CookieJar } from 'tough-cookie';
import { z } from 'zod';

import { isAuthenticated, parseDiplomas } from './utils.js';

type Bindings = {
  CAS_PASSWORD: string;
  CAS_USERNAME: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/diplomas', async (c) => {
  try {
    const auth = new CasAuthentication({
      password: c.env.CAS_PASSWORD,
      username: c.env.CAS_USERNAME,
    });

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

    if (!isAuthenticated(html)) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const diplomas = parseDiplomas(html);

    return c.json(diplomas);
  } catch (error) {
    console.error('Failed to fetch diplomas:', error);

    return c.json({ error: 'Failed to fetch diplomas' }, 500);
  }
});

export default app;
