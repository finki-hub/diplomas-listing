import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { authenticateAndFetch } from './auth.js';
import { isAuthenticated, parseDiplomas } from './utils.js';

type Bindings = {
  CAS_PASSWORD: string;
  CAS_USERNAME: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/diplomas', async (c) => {
  try {
    const html = await authenticateAndFetch(
      c.env.CAS_USERNAME,
      c.env.CAS_PASSWORD,
    );

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
