import { apiServiceName, useApiVersion } from '@/config/api-config';

describe('apiServiceName', () => {
  const original = process.env.USE_API_VERSION;

  afterEach(() => {
    if (original === undefined) delete process.env.USE_API_VERSION;
    else process.env.USE_API_VERSION = original;
  });

  it('includes the pinned version by default', () => {
    delete process.env.USE_API_VERSION;
    expect(useApiVersion()).toBe(true);
    expect(apiServiceName('templating')).toBe('templating/2.1');
  });

  it('keeps the version for any value other than "false"', () => {
    process.env.USE_API_VERSION = 'true';
    expect(apiServiceName('templating')).toBe('templating/2.1');
    process.env.USE_API_VERSION = '0';
    expect(apiServiceName('templating')).toBe('templating/2.1');
  });

  it('drops the version when USE_API_VERSION=false so the gateway serves the latest', () => {
    process.env.USE_API_VERSION = 'false';
    expect(useApiVersion()).toBe(false);
    expect(apiServiceName('templating')).toBe('templating');
    expect(apiServiceName('jsonschema')).toBe('jsonschema');
  });

  it('still resolves aliases without a version', () => {
    process.env.USE_API_VERSION = 'false';
    expect(apiServiceName('supportmanagement')).toBe('support-management-alkt-sprint');
  });

  it('passes unknown names through unchanged', () => {
    process.env.USE_API_VERSION = 'false';
    expect(apiServiceName('unknown')).toBe('unknown');
  });
});
