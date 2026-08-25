import { adminEnvironmentFromKind, checkingAdminEnvironment, shouldTreatAsProduction } from '../admin-environment';

describe('admin-environment', () => {
  it('resolves test environment visuals', () => {
    const environment = adminEnvironmentFromKind('test');

    expect(environment).toMatchObject({
      status: 'resolved',
      kind: 'test',
      label: 'Testmiljö',
    });
  });

  it('gives production and test different visual treatments', () => {
    const production = adminEnvironmentFromKind('production');
    const test = adminEnvironmentFromKind('test');

    expect(production.kind).toBe('production');
    expect(test.kind).toBe('test');
    expect(production.headerClassName).not.toBe(test.headerClassName);
    expect(production.badgeClassName).not.toBe(test.badgeClassName);
  });

  it('treats unresolved environment as production for risky actions', () => {
    const environment = checkingAdminEnvironment();

    expect(environment).toMatchObject({ status: 'checking', kind: 'unknown' });
    expect(shouldTreatAsProduction(environment)).toBe(true);
  });
});
