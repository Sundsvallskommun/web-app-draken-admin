import 'reflect-metadata';
import { HttpException } from '@/exceptions/HttpException';
import type { User } from '@/interfaces/users.interface';
import ApiService from '@/services/api.service';
import { DELETE_SECTION_ORDER, NamespaceDeleteService } from '@/services/namespace-delete.service';
import prisma from '@/utils/prisma';

jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() }, stream: { write: jest.fn() } }));
jest.mock('@/utils/prisma', () => ({ __esModule: true, default: { featureFlags: { findMany: jest.fn(), deleteMany: jest.fn() } } }));
jest.mock('@/config/api-config', () => ({ apiServiceName: (name: string) => `${name}/1.0` }));

const findMany = prisma.featureFlags.findMany as unknown as jest.Mock;
const deleteMany = prisma.featureFlags.deleteMany as unknown as jest.Mock;
const user = { username: 'tester', permissions: { canUseAdminPanel: true } } as unknown as User;
const base = 'supportmanagement/1.0/2281/NS';
const notFound = () => new HttpException(404, 'Not found');

/** A gateway with one of everything. */
const gatewayGet = ({ url }: { url: string }) => {
  const path = url.replace(`${base}/`, '');
  const table: Record<string, unknown> = {
    'namespace-config': { displayName: 'X', shortCode: 'X' },
    'errands/count': { count: 0 },
    'email-integration-config': { enabled: true, statusForNew: 'NEW' },
    'namespace-config/action-config': [{ id: 'ac1', name: 'Auto close' }],
    'metadata/phases': [
      { id: 'p1', name: 'INTAKE', transitions: [{ id: 't1', targetPhaseId: 'p2', targetPhaseName: 'WORK' }] },
      { id: 'p2', name: 'WORK', transitions: [] },
    ],
    'metadata/labels': { labelStructure: [{ classification: 'C', resourceName: 'R' }] },
    'metadata/label-classifications': [{ id: 'lc1', classification: 'CATEGORY' }],
    'metadata/external-id-types': [{ id: 'e1', name: 'PRIVATE' }],
    'metadata/statementoutcomes': [{ id: 'so1', name: 'ANSWERED' }],
    'metadata/decisionoutcomes': [{ id: 'do1', name: 'APPROVED' }],
    'metadata/measuretypes': [{ id: 'mt1', name: 'VISIT' }],
    'metadata/attachmentpurposes': [{ id: 'ap1', name: 'EVIDENCE' }],
    'metadata/contactreasons': [{ id: 'cr1', reason: 'QUESTION' }],
    'metadata/categories': [{ id: 'c1', name: 'CAT' }],
    'metadata/roles': [{ id: 'r1', name: 'CONTACT' }],
    'metadata/statuses': [
      { id: 's1', name: 'NEW' },
      { id: 's2', name: 'SOLVED' },
    ],
  };
  return path in table ? Promise.resolve({ data: table[path] }) : Promise.reject(notFound());
};

const makeApi = () => {
  const api = { get: jest.fn(gatewayGet), delete: jest.fn().mockResolvedValue({ data: undefined }) };
  return api;
};

describe('NamespaceDeleteService.inspect', () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([{ id: 7, application: 'draken', name: 'flag' }]);
    deleteMany.mockReset().mockResolvedValue({ count: 1 });
  });

  it('returns null when the namespace does not exist', async () => {
    const api = makeApi();
    api.get.mockRejectedValue(notFound());
    const service = new NamespaceDeleteService(api as unknown as ApiService, user, 2281);
    expect(await service.inspect('NOPE')).toBeNull();
  });

  it('collects every per-namespace resource with delete paths and labels', async () => {
    const service = new NamespaceDeleteService(makeApi() as unknown as ApiService, user, 2281);

    const inspection = await service.inspect('NS');

    expect(inspection.errandCount).toBe(0);
    const { plan } = inspection;
    expect(plan.emailIntegration).toEqual([{ path: 'email-integration-config', label: 'emailIntegration' }]);
    expect(plan.actionConfigs).toEqual([{ path: 'namespace-config/action-config/ac1', label: 'Auto close' }]);
    expect(plan.phaseTransitions).toEqual([{ path: 'metadata/phases/p1/transitions/t1', label: 'INTAKE → WORK' }]);
    expect(plan.phases.map(item => item.path)).toEqual(['metadata/phases/p1', 'metadata/phases/p2']);
    expect(plan.labels).toEqual([{ path: 'metadata/labels', label: 'labels (1 rot)' }]);
    expect(plan.labelClassifications).toEqual([{ path: 'metadata/label-classifications/CATEGORY', label: 'CATEGORY' }]);
    expect(plan.externalIdTypes).toEqual([{ path: 'metadata/external-id-types/e1', label: 'PRIVATE' }]);
    expect(plan.contactReasons).toEqual([{ path: 'metadata/contactreasons/cr1', label: 'QUESTION' }]);
    expect(plan.statuses.map(item => item.label)).toEqual(['NEW', 'SOLVED']);
    expect(plan.namespaceConfig).toEqual([{ path: 'namespace-config', label: 'NS' }]);
    expect(plan.featureFlags).toEqual([{ path: '7', label: 'draken::flag' }]);
  });

  it('reports the errand count and tolerates missing sub-resources', async () => {
    const api = makeApi();
    api.get.mockImplementation(({ url }) => {
      if (url.endsWith('/namespace-config')) return Promise.resolve({ data: { displayName: 'X', shortCode: 'X' } });
      if (url.endsWith('/errands/count')) return Promise.resolve({ data: { count: 12 } });
      return Promise.reject(notFound());
    });
    findMany.mockResolvedValue([]);
    const service = new NamespaceDeleteService(api as unknown as ApiService, user, 2281);

    const inspection = await service.inspect('NS');

    expect(inspection.errandCount).toBe(12);
    expect(inspection.plan.emailIntegration).toEqual([]);
    expect(inspection.plan.labels).toEqual([]);
    expect(inspection.plan.statuses).toEqual([]);
    expect(inspection.plan.namespaceConfig).toHaveLength(1);
  });
});

describe('NamespaceDeleteService.execute', () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([{ id: 7, application: 'draken', name: 'flag' }]);
    deleteMany.mockReset().mockResolvedValue({ count: 1 });
  });

  it('deletes everything most dependent first and the namespace config before the feature flags', async () => {
    const api = makeApi();
    const service = new NamespaceDeleteService(api as unknown as ApiService, user, 2281);
    const { plan } = await service.inspect('NS');

    const result = await service.execute('NS', plan);

    expect(result.completed).toBe(true);
    expect(result.steps.map(step => step.section)).toEqual([...DELETE_SECTION_ORDER]);
    expect(result.steps.every(step => step.status === 'done')).toBe(true);
    expect(api.delete.mock.calls.map(([config]) => config.url.replace(`${base}/`, ''))).toEqual([
      'email-integration-config',
      'namespace-config/action-config/ac1',
      'metadata/phases/p1/transitions/t1',
      'metadata/phases/p1',
      'metadata/phases/p2',
      'metadata/labels',
      'metadata/label-classifications/CATEGORY',
      'metadata/external-id-types/e1',
      'metadata/statementoutcomes/so1',
      'metadata/decisionoutcomes/do1',
      'metadata/measuretypes/mt1',
      'metadata/attachmentpurposes/ap1',
      'metadata/contactreasons/cr1',
      'metadata/categories/c1',
      'metadata/roles/r1',
      'metadata/statuses/s1',
      'metadata/statuses/s2',
      'namespace-config',
    ]);
    expect(deleteMany).toHaveBeenCalledWith({ where: { municipalityId: 2281, namespace: 'NS' } });
    expect(result.steps.find(step => step.section === 'featureFlags').deleted).toEqual(['draken::flag']);
  });

  it('stops at the first failure and never reaches the namespace config', async () => {
    const api = makeApi();
    api.delete.mockImplementation(({ url }) =>
      url.endsWith('/metadata/statuses/s2') ? Promise.reject(new HttpException(500, 'in use')) : Promise.resolve({ data: undefined }),
    );
    const service = new NamespaceDeleteService(api as unknown as ApiService, user, 2281);
    const { plan } = await service.inspect('NS');

    const result = await service.execute('NS', plan);

    expect(result.completed).toBe(false);
    const byName = Object.fromEntries(result.steps.map(step => [step.section, step]));
    expect(byName.roles.status).toBe('done');
    expect(byName.statuses).toMatchObject({ status: 'failed', deleted: ['NEW'], error: 'statuses/SOLVED: in use' });
    expect(byName.namespaceConfig.status).toBe('not_run');
    expect(byName.featureFlags.status).toBe('not_run');
    expect(api.delete.mock.calls.map(([config]) => config.url)).not.toContain(`${base}/namespace-config`);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('skips empty sections', async () => {
    const api = makeApi();
    const service = new NamespaceDeleteService(api as unknown as ApiService, user, 2281);
    const { plan } = await service.inspect('NS');
    plan.phases = [];
    plan.phaseTransitions = [];

    const result = await service.execute('NS', plan);

    expect(result.steps.find(step => step.section === 'phases').status).toBe('skipped');
    expect(api.delete.mock.calls.some(([config]) => config.url.includes('/metadata/phases'))).toBe(false);
  });
});
