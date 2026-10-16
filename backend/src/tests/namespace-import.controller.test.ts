import 'reflect-metadata';
import { NamespaceImportController } from '@controllers/namespace-import.controller';
import type { NamespaceImportDto } from '@/dtos/namespace-import.dto';
import { NamespaceDeleteService } from '@/services/namespace-delete.service';
import { NamespaceImportService } from '@/services/namespace-import.service';

jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() }, stream: { write: jest.fn() } }));
jest.mock('@/utils/prisma', () => ({ __esModule: true, default: {} }));
jest.mock('@/services/api.service', () => ({ __esModule: true, default: jest.fn().mockImplementation(() => ({})) }));
jest.mock('@/services/namespace-import.service');
jest.mock('@/services/namespace-delete.service', () => {
  const actual = jest.requireActual('@/services/namespace-delete.service');
  return { ...actual, NamespaceDeleteService: jest.fn() };
});

const ServiceMock = NamespaceImportService as jest.MockedClass<typeof NamespaceImportService>;
const DeleteMock = NamespaceDeleteService as jest.MockedClass<typeof NamespaceDeleteService>;

const makeRes = () => {
  const res: any = {};
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const req: any = { user: { username: 'tester', permissions: { canUseAdminPanel: true } } };

const doc = (): NamespaceImportDto => ({
  formatVersion: '1',
  namespace: 'NEW_NS',
  config: { displayName: 'Nytt', shortCode: 'NN' },
  statuses: [{ name: 'NEW' }],
  emailIntegration: { enabled: true, statusForNew: 'NEW', ignoreAutoReply: true, ignoreNoReply: true },
});

const lastService = () => ServiceMock.mock.instances[ServiceMock.mock.instances.length - 1] as jest.Mocked<NamespaceImportService>;

const sent = (res: any) => res.send.mock.calls[0][0].data;

describe('NamespaceImportController.importNamespace', () => {
  beforeEach(() => {
    ServiceMock.mockClear();
    ServiceMock.prototype.namespaceExists = jest.fn().mockResolvedValue(false);
    ServiceMock.prototype.fetchExistingState = jest.fn().mockResolvedValue(null);
    ServiceMock.prototype.executeImport = jest.fn().mockResolvedValue({ steps: [], completed: true });
  });

  it('returns invalid with structural issues before touching the gateway', async () => {
    const res = makeRes();
    const body = { ...doc(), bogus: 1 } as unknown as NamespaceImportDto;

    await new NamespaceImportController().importNamespace(req, res, 2281, body, true, false);

    const report = sent(res);
    expect(report.outcome).toBe('invalid');
    expect(report.issues).toEqual([expect.objectContaining({ path: 'bogus', severity: 'error' })]);
    expect(ServiceMock).not.toHaveBeenCalled();
  });

  it('returns conflict when the namespace exists and allowExisting is off', async () => {
    ServiceMock.prototype.namespaceExists = jest.fn().mockResolvedValue(true);
    const res = makeRes();

    await new NamespaceImportController().importNamespace(req, res, 2281, doc(), true, false);

    const report = sent(res);
    expect(report.outcome).toBe('conflict');
    expect(report.issues[0]).toMatchObject({ path: 'namespace', severity: 'error' });
    expect(lastService().fetchExistingState).not.toHaveBeenCalled();
    expect(lastService().executeImport).not.toHaveBeenCalled();
  });

  it('returns invalid with semantic issues and no plan', async () => {
    const body = doc();
    body.emailIntegration.statusForNew = 'MISSING';
    const res = makeRes();

    await new NamespaceImportController().importNamespace(req, res, 2281, body, false, false);

    const report = sent(res);
    expect(report.outcome).toBe('invalid');
    expect(report.issues.map((issue: { path: string }) => issue.path)).toEqual(['emailIntegration.statusForNew']);
    expect(report.plan).toEqual([]);
    expect(lastService().executeImport).not.toHaveBeenCalled();
  });

  it('returns valid with a plan on a dry run and does not execute', async () => {
    const res = makeRes();

    await new NamespaceImportController().importNamespace(req, res, 2281, doc(), true, false);

    const report = sent(res);
    expect(report).toMatchObject({ outcome: 'valid', dryRun: true, allowExisting: false, namespace: 'NEW_NS', steps: [] });
    expect(report.plan.find((entry: { section: string }) => entry.section === 'statuses')).toEqual({
      section: 'statuses',
      create: 1,
      skip: 0,
      skipped: [],
    });
    expect(lastService().executeImport).not.toHaveBeenCalled();
  });

  it('executes the plan when not a dry run and reports completed or partial_failure', async () => {
    const steps = [{ section: 'namespaceConfig', status: 'done', created: ['NEW_NS'], skipped: [] }];
    ServiceMock.prototype.executeImport = jest.fn().mockResolvedValue({ steps, completed: false });
    const res = makeRes();

    await new NamespaceImportController().importNamespace(req, res, 2281, doc(), false, false);

    const report = sent(res);
    expect(report.outcome).toBe('partial_failure');
    expect(report.steps).toEqual(steps);
    expect(lastService().executeImport).toHaveBeenCalledWith(expect.objectContaining({ namespace: 'NEW_NS' }), report.plan);
  });

  it('uses the existing state under allowExisting so references to existing statuses pass', async () => {
    ServiceMock.prototype.namespaceExists = jest.fn().mockResolvedValue(true);
    ServiceMock.prototype.fetchExistingState = jest.fn().mockResolvedValue({
      statuses: new Set(['NEW']),
      roles: new Set(),
      categories: new Set(),
      contactReasons: new Set(),
      attachmentPurposes: new Set(),
      measureTypes: new Set(),
      decisionOutcomes: new Set(),
      statementOutcomes: new Set(),
      hasLabels: false,
      hasEmailIntegration: false,
      featureFlags: new Set(),
    });
    const body = doc();
    body.statuses = [];
    const res = makeRes();

    await new NamespaceImportController().importNamespace(req, res, 2281, body, true, true);

    const report = sent(res);
    expect(report.outcome).toBe('valid');
    expect(report.plan.find((entry: { section: string }) => entry.section === 'namespaceConfig')).toMatchObject({ create: 0, skip: 1 });
  });
});

describe('NamespaceImportController.exportNamespace', () => {
  beforeEach(() => ServiceMock.mockClear());

  it('returns the document', async () => {
    const document = doc();
    ServiceMock.prototype.exportNamespace = jest.fn().mockResolvedValue(document);
    const res = makeRes();

    await new NamespaceImportController().exportNamespace(req, res, 2281, 'NEW_NS');

    expect(res.send).toHaveBeenCalledWith({ data: document, message: 'success' });
  });

  it('throws 404 when the namespace does not exist', async () => {
    ServiceMock.prototype.exportNamespace = jest.fn().mockResolvedValue(null);

    await expect(new NamespaceImportController().exportNamespace(req, makeRes(), 2281, 'NOPE')).rejects.toMatchObject({ status: 404 });
  });
});

describe('NamespaceImportController.deleteNamespace', () => {
  const emptyPlan = () => ({
    emailIntegration: [],
    actionConfigs: [],
    phaseTransitions: [],
    phases: [],
    labels: [],
    labelClassifications: [],
    externalIdTypes: [],
    statementOutcomes: [],
    decisionOutcomes: [],
    measureTypes: [],
    attachmentPurposes: [],
    contactReasons: [],
    categories: [],
    roles: [],
    statuses: [{ path: 'metadata/statuses/s1', label: 'NEW' }],
    namespaceConfig: [{ path: 'namespace-config', label: 'NS' }],
    featureFlags: [],
  });

  beforeEach(() => {
    DeleteMock.mockClear();
    DeleteMock.prototype.inspect = jest.fn().mockResolvedValue({ errandCount: 0, plan: emptyPlan() });
    DeleteMock.prototype.execute = jest.fn().mockResolvedValue({ steps: [], completed: true });
  });

  it('returns not_found when the namespace does not exist', async () => {
    DeleteMock.prototype.inspect = jest.fn().mockResolvedValue(null);
    const res = makeRes();

    await new NamespaceImportController().deleteNamespace(req, res, 2281, 'NOPE', true);

    expect(sent(res)).toMatchObject({ outcome: 'not_found', namespace: 'NOPE', plan: [] });
  });

  it('refuses with has_errands and does not execute, even without dryRun', async () => {
    DeleteMock.prototype.inspect = jest.fn().mockResolvedValue({ errandCount: 3, plan: emptyPlan() });
    const res = makeRes();

    await new NamespaceImportController().deleteNamespace(req, res, 2281, 'NS', false);

    const report = sent(res);
    expect(report).toMatchObject({ outcome: 'has_errands', errandCount: 3 });
    expect(report.plan.find((entry: { section: string }) => entry.section === 'statuses')).toEqual({ section: 'statuses', items: ['NEW'] });
    expect(DeleteMock.prototype.execute).not.toHaveBeenCalled();
  });

  it('returns ready with the plan on a dry run', async () => {
    const res = makeRes();

    await new NamespaceImportController().deleteNamespace(req, res, 2281, 'NS', true);

    expect(sent(res)).toMatchObject({ outcome: 'ready', dryRun: true, steps: [] });
    expect(DeleteMock.prototype.execute).not.toHaveBeenCalled();
  });

  it('executes and reports completed', async () => {
    const steps = [{ section: 'statuses', status: 'done', deleted: ['NEW'] }];
    DeleteMock.prototype.execute = jest.fn().mockResolvedValue({ steps, completed: true });
    const res = makeRes();

    await new NamespaceImportController().deleteNamespace(req, res, 2281, 'NS', false);

    expect(sent(res)).toMatchObject({ outcome: 'completed', steps });
    expect(DeleteMock.prototype.execute).toHaveBeenCalledWith(
      'NS',
      expect.objectContaining({ statuses: [{ path: 'metadata/statuses/s1', label: 'NEW' }] }),
    );
  });
});
