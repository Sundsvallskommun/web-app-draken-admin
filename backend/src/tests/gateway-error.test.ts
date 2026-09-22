import { apiFromUrl, classifyGatewayFailure, serializeBody } from '@utils/gateway-error';

const SM = 'https://api-test.sundsvall.se/supportmanagement/14.7/2281/CC/metadata/labels';

// The real gateway returns the fault bare, not wrapped in `{ fault: ... }`, and `code` is a string.
const SUBSCRIPTION_FAULT = {
  code: '900908',
  message: 'Resource forbidden ',
  description: 'User is NOT authorized to access the Resource. API Subscription validation failed.',
};

const ROUTING_FAULT = {
  code: '404',
  type: 'Status report',
  message: 'Runtime Error',
  description: 'No matching resource found for given API Request',
};

describe('apiFromUrl', () => {
  it('picks the name/version pair of a declared API out of a gateway url', () => {
    expect(apiFromUrl(SM)).toBe('supportmanagement/14.7');
    expect(apiFromUrl('https://api-test.sundsvall.se/templating/2.1/2281/templates')).toBe('templating/2.1');
  });

  it('is undefined when no segment matches a declared API', () => {
    expect(apiFromUrl('https://api-test.sundsvall.se/somethingelse/1.0/2281')).toBeUndefined();
  });
});

describe('classifyGatewayFailure', () => {
  it('names the API that lacks a subscription', () => {
    const { status, message } = classifyGatewayFailure('GET', SM, 403, SUBSCRIPTION_FAULT);

    expect(status).toBe(502);
    expect(message).toContain('Missing API subscription');
    expect(message).toContain('supportmanagement/14.7');
  });

  it('also accepts the wrapped fault shape', () => {
    const { message } = classifyGatewayFailure('GET', SM, 403, { fault: SUBSCRIPTION_FAULT });

    expect(message).toContain('Missing API subscription');
  });

  it("reports a non-existent API version rather than a swallowable 'not found'", () => {
    const { status, message } = classifyGatewayFailure('GET', SM, 404, ROUTING_FAULT);

    expect(status).toBe(502);
    expect(message).toContain('supportmanagement/14.7');
    expect(message).toContain('version');
  });

  it('leaves an ordinary upstream 404 as a 404', () => {
    expect(classifyGatewayFailure('GET', SM, 404, { message: 'Label not found' })).toEqual({ status: 404, message: 'Not found' });
  });

  it('points at the credentials on an auth fault', () => {
    const { status, message } = classifyGatewayFailure('GET', 'https://api-test.sundsvall.se/templating/2.1/2281/templates', 401, {
      code: '900901',
      description: 'Invalid Credentials',
    });

    expect(status).toBe(502);
    expect(message).toContain('CLIENT_KEY');
    expect(message).toContain('templating/2.1');
  });

  it('still reports the url and status when the API is unrecognised', () => {
    const { status, message } = classifyGatewayFailure('POST', 'https://api-test.sundsvall.se/unknown/9.9/x', 500, { error: 'boom' });

    expect(status).toBe(500);
    expect(message).toContain('POST https://api-test.sundsvall.se/unknown/9.9/x');
    expect(message).toContain('500');
  });
});

describe('serializeBody', () => {
  it('caps long bodies and handles empty ones', () => {
    expect(serializeBody(undefined)).toBe('<no body>');
    expect(serializeBody({ a: 1 })).toBe('{"a":1}');
    expect(serializeBody('x'.repeat(600)).length).toBe(501);
  });
});
