import request from 'supertest';
import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import { localApi } from '@utils/util';

afterAll(async () => {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
});

// NODE_ENV is "test" under jest, so the CORS whitelist is enforced exactly as in production.
describe('CORS and the SAML routes', () => {
  const app = new App([IndexController]).getServer();

  it('still rejects API requests from an origin outside the whitelist', async () => {
    const res = await request(app).get(localApi('/')).set('Origin', 'null');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Not allowed by CORS');
  });

  it('lets the IdP post the SAML response even when the browser sends "Origin: null"', async () => {
    // A page served with "Referrer-Policy: no-referrer" makes the browser send a null origin.
    const res = await request(app)
      .post(localApi('saml/login/callback'))
      .set('Origin', 'null')
      .type('form')
      .send({ RelayState: 'http://localhost:3002/,http://localhost:3002/login' });
    // Without a SAMLResponse passport bounces the browser back to the IdP, which is a redirect,
    // not the 500 the CORS middleware produces.
    expect(res.status).toBe(302);
    expect(res.body.message).not.toBe('Not allowed by CORS');
  });
});
