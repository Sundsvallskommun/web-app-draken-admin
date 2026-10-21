import 'reflect-metadata';
import type { NamespaceImportDto } from '@/dtos/namespace-import.dto';
import { HttpException } from '@/exceptions/HttpException';
import type { User } from '@/interfaces/users.interface';
import ApiService from '@/services/api.service';
import { NamespaceImportService } from '@/services/namespace-import.service';
import { SECTION_ORDER, buildImportPlan } from '@/utils/namespace-import-validation';
import prisma from '@/utils/prisma';

jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() }, stream: { write: jest.fn() } }));
jest.mock('@/utils/prisma', () => ({
  __esModule: true,
  default: { featureFlags: { findMany: jest.fn(), create: jest.fn() }, $transaction: jest.fn() },
}));
jest.mock('@/config/api-config', () => ({ apiServiceName: (name: string) => `${name}/1.0` }));

const findMany = prisma.featureFlags.findMany as unknown as jest.Mock;
const create = prisma.featureFlags.create as unknown as jest.Mock;
const transaction = prisma.$transaction as unknown as jest.Mock;

const user = { username: 'tester', permissions: { canUseAdminPanel: true } } as unknown as User;

const notFound = () => new HttpException(404, 'Not found');

const makeApi = () => {
  const api = { get: jest.fn(), post: jest.fn(), put: jest.fn() };
  api.post.mockResolvedValue({ data: {}, message: 'success' });
  api.put.mockResolvedValue({ data: {}, message: 'success' });
  return api;
};

const doc = (): NamespaceImportDto => ({
  formatVersion: '1',
  namespace: 'NEW_NS',
  config: { displayName: 'Nytt', shortCode: 'NN', notificationTTLInDays: 10, accessControl: false, notifyReporter: false },
  statuses: [{ name: 'NEW' }, { name: 'SOLVED' }],
  roles: [
    { name: 'A', displayName: 'A' },
    { name: 'B', displayName: 'B' },
  ],
  categories: [{ name: 'CAT', types: [{ name: 'T' }] }],
  contactReasons: [{ reason: 'Q' }],
  attachmentPurposes: [{ name: 'AP' }],
  measureTypes: [{ name: 'MT', measureGroups: ['G'] }],
  decisionOutcomes: [{ name: 'DO' }],
  statementOutcomes: [{ name: 'SO' }],
  labels: [{ classification: 'CATEGORY', resourceName: 'ROOT' }],
  emailIntegration: {
    enabled: true,
    statusForNew: 'NEW',
    ignoreAutoReply: true,
    ignoreNoReply: true,
    daysOfInactivityBeforeReject: 3,
    addSenderAsStakeholder: true,
  },
  featureFlags: [
    { name: 'f1', description: '', enabled: true, application: 'draken' },
    { name: 'f2', description: '', enabled: false, application: 'draken' },
  ],
});

const base = 'supportmanagement/1.0/2281/NEW_NS';

describe('NamespaceImportService.executeImport', () => {
  beforeEach(() => {
    findMany.mockReset();
    create.mockReset();
    transaction.mockReset().mockResolvedValue([]);
    create.mockImplementation(args => args);
  });

  it('writes every section in SECTION_ORDER against the right gateway URLs', async () => {
    const api = makeApi();
    const service = new NamespaceImportService(api as unknown as ApiService, user, 2281);
    const document = doc();

    const result = await service.executeImport(document, buildImportPlan(document, null));

    expect(result.completed).toBe(true);
    expect(result.steps.map(step => step.section)).toEqual([...SECTION_ORDER]);
    expect(result.steps.every(step => step.status === 'done')).toBe(true);

    const postUrls = api.post.mock.calls.map(([config]) => config.url);
    expect(postUrls).toEqual([
      `${base}/namespace-config`,
      `${base}/metadata/statuses`,
      `${base}/metadata/statuses`,
      `${base}/metadata/roles`,
      `${base}/metadata/roles`,
      `${base}/metadata/categories`,
      `${base}/metadata/contactreasons`,
      `${base}/metadata/attachmentpurposes`,
      `${base}/metadata/measuretypes`,
      `${base}/metadata/decisionoutcomes`,
      `${base}/metadata/statementoutcomes`,
      `${base}/metadata/labels`,
      `${base}/email-integration-config`,
    ]);
    expect(api.post.mock.calls[0][0].data).toEqual({
      displayName: 'Nytt',
      shortCode: 'NN',
      notificationTTLInDays: 10,
      accessControl: false,
      notifyReporter: false,
    });
    // Labels go as the bare array, like labels.controller.ts.
    expect(api.post.mock.calls[11][0].data).toEqual([{ classification: 'CATEGORY', resourceName: 'ROOT' }]);
    // Email integration is created with POST (the gateway's PUT is update-only), with the
    // string conversions from email-integration.controller.ts.
    expect(api.put).not.toHaveBeenCalled();
    expect(api.post.mock.calls[12][0]).toMatchObject({
      url: `${base}/email-integration-config`,
      data: { daysOfInactivityBeforeReject: '3', addSenderAsStakeholder: 'true', statusForNew: 'NEW' },
    });
    // Optional gateway fields are forwarded so the import is lossless.
    expect(api.post.mock.calls[1][0].data).toEqual({
      name: 'NEW',
      displayName: undefined,
      externalDisplayName: undefined,
      sortOrder: undefined,
      deprecated: false,
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0]).toEqual({
      data: { name: 'f1', description: '', enabled: true, application: 'draken', namespace: 'NEW_NS', municipalityId: 2281 },
    });
    expect(result.steps.find(step => step.section === 'featureFlags').created).toEqual(['draken::f1', 'draken::f2']);
  });

  it('stops at the first failure, records what was created and marks later sections not_run', async () => {
    const api = makeApi();
    api.post.mockImplementation(({ url, data }) => {
      if (url.endsWith('/metadata/roles') && data.name === 'B') {
        return Promise.reject(new HttpException(500, 'Gateway call failed: duplicate'));
      }
      return Promise.resolve({ data: {}, message: 'success' });
    });
    const service = new NamespaceImportService(api as unknown as ApiService, user, 2281);
    const document = doc();

    const result = await service.executeImport(document, buildImportPlan(document, null));

    expect(result.completed).toBe(false);
    const byName = Object.fromEntries(result.steps.map(step => [step.section, step]));
    expect(byName.namespaceConfig.status).toBe('done');
    expect(byName.statuses).toMatchObject({ status: 'done', created: ['NEW', 'SOLVED'] });
    expect(byName.roles).toMatchObject({ status: 'failed', created: ['A'], error: 'roles/B: Gateway call failed: duplicate' });
    expect(byName.categories.status).toBe('not_run');
    expect(byName.featureFlags.status).toBe('not_run');
    expect(api.post.mock.calls.map(([config]) => config.url)).not.toContain(`${base}/email-integration-config`);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('honours the plan: skips existing items, existing labels and email integration', async () => {
    const api = makeApi();
    const service = new NamespaceImportService(api as unknown as ApiService, user, 2281);
    const document = doc();
    const plan = buildImportPlan(document, {
      statuses: new Set(['NEW']),
      roles: new Set(['A', 'B']),
      categories: new Set(),
      contactReasons: new Set(),
      attachmentPurposes: new Set(),
      measureTypes: new Set(),
      decisionOutcomes: new Set(),
      statementOutcomes: new Set(),
      hasLabels: true,
      hasEmailIntegration: true,
      featureFlags: new Set(['draken::f1']),
    });

    const result = await service.executeImport(document, plan);

    expect(result.completed).toBe(true);
    const byName = Object.fromEntries(result.steps.map(step => [step.section, step]));
    expect(byName.namespaceConfig).toMatchObject({ status: 'skipped', skipped: ['NEW_NS'] });
    expect(byName.statuses).toMatchObject({ status: 'done', created: ['SOLVED'], skipped: ['NEW'] });
    expect(byName.roles).toMatchObject({ status: 'skipped', created: [], skipped: ['A', 'B'] });
    expect(byName.labels.status).toBe('skipped');
    expect(byName.emailIntegration.status).toBe('skipped');
    expect(byName.featureFlags).toMatchObject({ status: 'done', created: ['draken::f2'], skipped: ['draken::f1'] });

    const postUrls = api.post.mock.calls.map(([config]) => config.url);
    expect(postUrls).not.toContain(`${base}/namespace-config`);
    expect(postUrls).not.toContain(`${base}/metadata/labels`);
    expect(postUrls.filter(url => url.endsWith('/metadata/statuses'))).toHaveLength(1);
    expect(postUrls).not.toContain(`${base}/email-integration-config`);
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe('NamespaceImportService reads', () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
  });

  it('namespaceExists treats a gateway 404 as absent', async () => {
    const api = makeApi();
    api.get.mockRejectedValue(notFound());
    const service = new NamespaceImportService(api as unknown as ApiService, user, 2281);
    expect(await service.namespaceExists('NOPE')).toBe(false);
    expect(await service.exportNamespace('NOPE')).toBeNull();
    expect(await service.fetchExistingState('NOPE')).toBeNull();
  });

  it('fetchExistingState collects names and presence flags, tolerating 404 on sub-resources', async () => {
    const api = makeApi();
    api.get.mockImplementation(({ url }) => {
      if (url.endsWith('/namespace-config')) return Promise.resolve({ data: { displayName: 'X', shortCode: 'X' } });
      if (url.endsWith('/metadata/statuses')) return Promise.resolve({ data: [{ id: '1', name: 'NEW' }] });
      if (url.endsWith('/metadata/contactreasons')) return Promise.resolve({ data: [{ id: '2', reason: 'Q' }] });
      if (url.endsWith('/metadata/labels')) return Promise.resolve({ data: { labelStructure: [{ classification: 'C', resourceName: 'R' }] } });
      return Promise.reject(notFound());
    });
    findMany.mockResolvedValue([{ application: 'draken', name: 'f1' }]);
    const service = new NamespaceImportService(api as unknown as ApiService, user, 2281);

    const state = await service.fetchExistingState('NS');

    expect(state).toMatchObject({ hasLabels: true, hasEmailIntegration: false });
    expect([...state.statuses]).toEqual(['NEW']);
    expect([...state.contactReasons]).toEqual(['Q']);
    expect([...state.roles]).toEqual([]);
    expect([...state.featureFlags]).toEqual(['draken::f1']);
    expect(findMany).toHaveBeenCalledWith({ where: { municipalityId: 2281, namespace: 'NS' } });
  });

  it('exportNamespace returns an import document for an existing namespace', async () => {
    const api = makeApi();
    api.get.mockImplementation(({ url }) => {
      if (url.endsWith('/namespace-config')) return Promise.resolve({ data: { displayName: 'X', shortCode: 'X', notificationTTLInDays: 1 } });
      if (url.endsWith('/metadata/roles')) return Promise.resolve({ data: [{ id: '1', name: 'R', displayName: 'Roll' }] });
      if (url.endsWith('/email-integration-config')) {
        return Promise.resolve({ data: { enabled: true, statusForNew: 'NEW', ignoreAutoReply: true, ignoreNoReply: true } });
      }
      return Promise.reject(notFound());
    });
    const service = new NamespaceImportService(api as unknown as ApiService, user, 2281);

    const exported = await service.exportNamespace('NS');

    expect(exported).toMatchObject({
      formatVersion: '1',
      namespace: 'NS',
      config: { displayName: 'X', shortCode: 'X', notificationTTLInDays: 1 },
      roles: [{ name: 'R', displayName: 'Roll' }],
      statuses: [],
      labels: [],
      emailIntegration: { enabled: true, statusForNew: 'NEW' },
      featureFlags: [],
    });
  });
});
