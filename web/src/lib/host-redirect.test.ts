import { describe, expect, it, vi } from 'vitest';

import { onRequest } from '../../../functions/_middleware';

const callMiddleware = (url: string, method = 'GET') => {
  const next = vi.fn(() => Promise.resolve(new Response('next')));
  const context = {
    next,
    request: new Request(url, { method }),
  } as Parameters<typeof onRequest>[0];

  return { next, response: onRequest(context) };
};

describe('Pages host aliases', () => {
  it.each([
    [
      'https://diplomas.finki-hub.com/diplomas/%E2%9C%93?q=a%2Fb&x=a+b',
      'https://theses.finki-hub.com/diplomas/%E2%9C%93?q=a%2Fb&x=a+b',
    ],
    [
      'https://masters.finki-hub.com/masters?lang=mk',
      'https://theses.finki-hub.com/masters?lang=mk',
    ],
    [
      'https://diplomski.finki-hub.com/%2F?q=%2f',
      'https://trudovi.finki-hub.com/%2F?q=%2f',
    ],
    [
      'https://magisterski.finki-hub.com/masters/%E2%9C%93?x=1',
      'https://trudovi.finki-hub.com/masters/%E2%9C%93?x=1',
    ],
  ])(
    'redirects %s to %s with permanent alias status',
    async (source, target) => {
      const { next, response } = callMiddleware(source, 'POST');
      const redirect = await response;

      expect(redirect).toBeInstanceOf(Response);
      expect(redirect.status).toBe(301);
      expect(redirect.headers.get('Location')).toBe(target);
      expect(redirect.headers.has('access-control-allow-origin')).toBe(false);
      expect(next).not.toHaveBeenCalled();
    },
  );

  it.each([
    'https://theses.finki-hub.com/masters',
    'https://trudovi.finki-hub.com/masters',
    'https://unrecognized.finki-hub.com/masters',
    'https://finki-hub-theses-listing.pages.dev/masters',
    'https://finki-diplomas-listing.pages.dev/masters',
    'http://localhost:4173/masters',
    'https://diplomas.finki-hub.com.evil.test/masters',
    'https://constructor/masters',
    'https://__proto__/masters',
    'https://toString/masters',
  ])('passes canonical, unknown, and local host %s through', async (url) => {
    const { next, response } = callMiddleware(url);

    await expect(response).resolves.toHaveProperty('status', 200);
    expect(next).toHaveBeenCalledOnce();
  });
});
