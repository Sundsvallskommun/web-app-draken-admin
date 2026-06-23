import { adminEnvironmentFromApiBaseUrl } from '@utils/admin-environment';

describe('adminEnvironmentFromApiBaseUrl', () => {
  it('treats empty API base URL as production', () => {
    expect(adminEnvironmentFromApiBaseUrl(undefined)).toEqual({ environment: 'production' });
    expect(adminEnvironmentFromApiBaseUrl('')).toEqual({ environment: 'production' });
  });

  it('treats api.sundsvall.se without -test as production', () => {
    expect(adminEnvironmentFromApiBaseUrl('https://api.sundsvall.se')).toEqual({ environment: 'production' });
    expect(adminEnvironmentFromApiBaseUrl('https://api.sundsvall.se/gateway')).toEqual({ environment: 'production' });
  });

  it('treats API hosts with -test as test', () => {
    expect(adminEnvironmentFromApiBaseUrl('https://api-test.sundsvall.se')).toEqual({ environment: 'test' });
    expect(adminEnvironmentFromApiBaseUrl('https://api-test.sundsvall.se/gateway')).toEqual({ environment: 'test' });
  });

  it('treats unknown URLs without -test as production', () => {
    expect(adminEnvironmentFromApiBaseUrl('http://localhost:3001')).toEqual({ environment: 'production' });
    expect(adminEnvironmentFromApiBaseUrl('not-a-url')).toEqual({ environment: 'production' });
  });
});
