import 'reflect-metadata';
import type { NamespaceImportDto } from '@/dtos/namespace-import.dto';
import {
  ExistingState,
  SECTION_ORDER,
  buildImportPlan,
  hasErrors,
  validateNamespaceImport,
  validateStructure,
} from '@/utils/namespace-import-validation';

const minimalDoc = (): NamespaceImportDto => ({
  formatVersion: '1',
  namespace: 'NEW_NS',
  config: { displayName: 'Nytt namespace', shortCode: 'NN', notificationTTLInDays: 40 },
  statuses: [{ name: 'NEW' }, { name: 'SOLVED', displayName: 'Löst' }],
  roles: [{ name: 'CONTACT', displayName: 'Kontakt' }],
  categories: [{ name: 'CAT', types: [{ name: 'TYPE_A', escalationEmail: 'a@example.com' }] }],
  contactReasons: [{ reason: 'QUESTION' }],
  attachmentPurposes: [{ name: 'EVIDENCE' }],
  measureTypes: [{ name: 'VISIT', measureGroups: ['INSPECTION'] }],
  decisionOutcomes: [{ name: 'APPROVED' }],
  statementOutcomes: [{ name: 'ANSWERED', responded: true }],
  labels: [
    {
      classification: 'CATEGORY',
      resourceName: 'ROOT',
      labels: [{ classification: 'TYPE', resourceName: 'LEAF', attributes: [{ key: 'escalationEmail', value: 'x@example.com' }] }],
    },
  ],
  emailIntegration: { enabled: true, statusForNew: 'NEW', ignoreAutoReply: true, ignoreNoReply: true, stakeholderRole: 'CONTACT' },
  featureFlags: [{ name: 'flag', description: '', enabled: true, application: 'draken' }],
});

const emptyExisting = (): ExistingState => ({
  statuses: new Set(),
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

const errorPaths = (doc: NamespaceImportDto, existing?: ExistingState) =>
  validateNamespaceImport(doc, existing)
    .filter(issue => issue.severity === 'error')
    .map(issue => issue.path);

describe('validateStructure', () => {
  it('accepts the minimal document', () => {
    expect(validateStructure(minimalDoc())).toEqual([]);
  });

  it('rejects non-objects', () => {
    expect(hasErrors(validateStructure(null))).toBe(true);
    expect(hasErrors(validateStructure([]))).toBe(true);
  });

  it('reports unknown properties with their path', () => {
    const doc = minimalDoc();
    (doc.categories[0].types[0] as unknown as Record<string, unknown>).escalation = 'typo';
    const issues = validateStructure(doc);
    expect(issues).toEqual([expect.objectContaining({ path: 'categories[0].types[0].escalation', severity: 'error' })]);
  });

  it('reports wrong types and missing required fields with nested paths', () => {
    const doc = minimalDoc() as unknown as Record<string, unknown>;
    doc.formatVersion = '2';
    (doc.config as Record<string, unknown>).shortCode = undefined;
    (doc.measureTypes as Record<string, unknown>[])[0].measureGroups = [];
    (doc.labels as Record<string, unknown>[])[0] = { classification: 'CATEGORY', resourceName: 'ROOT', labels: [{ classification: 'TYPE' }] };
    const paths = validateStructure(doc).map(issue => issue.path);
    expect(paths).toEqual(
      expect.arrayContaining(['formatVersion', 'config.shortCode', 'measureTypes[0].measureGroups', 'labels[0].labels[0].resourceName']),
    );
  });

  it('rejects a namespace that is not URL safe', () => {
    const doc = minimalDoc();
    doc.namespace = 'has space/slash';
    expect(validateStructure(doc).map(issue => issue.path)).toContain('namespace');
  });
});

describe('validateNamespaceImport', () => {
  it('has no errors for the minimal document', () => {
    expect(errorPaths(minimalDoc())).toEqual([]);
  });

  it('warns about a lowercase namespace but does not fail', () => {
    const doc = minimalDoc();
    doc.namespace = 'new-ns';
    const issues = validateNamespaceImport(doc);
    expect(issues).toEqual([expect.objectContaining({ path: 'namespace', severity: 'warning' })]);
  });

  it('requires displayName and shortCode and a non-negative TTL', () => {
    const doc = minimalDoc();
    doc.config = { displayName: ' ', shortCode: '', notificationTTLInDays: -1 };
    expect(errorPaths(doc)).toEqual(['config.displayName', 'config.shortCode', 'config.notificationTTLInDays']);
  });

  it('rejects duplicate and blank keys in list sections', () => {
    const doc = minimalDoc();
    doc.statuses = [{ name: 'NEW' }, { name: 'NEW' }, { name: ' ' }];
    doc.contactReasons = [{ reason: 'Q' }, { reason: 'Q' }];
    expect(errorPaths(doc)).toEqual(['statuses[1].name', 'statuses[2].name', 'contactReasons[1].reason']);
  });

  it('rejects duplicate type names within a category and warns on odd escalation emails', () => {
    const doc = minimalDoc();
    doc.categories = [{ name: 'CAT', types: [{ name: 'T' }, { name: 'T', escalationEmail: 'not-an-email' }] }];
    const issues = validateNamespaceImport(doc);
    expect(issues).toEqual([
      expect.objectContaining({ path: 'categories[0].types[1].name', severity: 'error' }),
      expect.objectContaining({ path: 'categories[0].types[1].escalationEmail', severity: 'warning' }),
    ]);
  });

  it('requires at least one unique, non-blank measure group', () => {
    const doc = minimalDoc();
    doc.measureTypes = [
      { name: 'A', measureGroups: [] },
      { name: 'B', measureGroups: ['G', 'G', ''] },
    ];
    expect(errorPaths(doc)).toEqual(['measureTypes[0].measureGroups', 'measureTypes[1].measureGroups[1]', 'measureTypes[1].measureGroups[2]']);
  });

  it('validates the label tree recursively', () => {
    const doc = minimalDoc();
    doc.labels = [
      { classification: 'CATEGORY', resourceName: 'lower' },
      {
        classification: '',
        resourceName: 'ROOT',
        attributes: [
          { key: 'k', value: '1' },
          { key: 'k', value: '2' },
        ],
      },
      {
        classification: 'CATEGORY',
        resourceName: 'ROOT',
        labels: [
          { classification: 'TYPE', resourceName: 'A' },
          { classification: 'TYPE', resourceName: 'A' },
        ],
      },
    ];
    expect(errorPaths(doc)).toEqual([
      'labels[0].resourceName',
      'labels[1].classification',
      'labels[1].attributes[1].key',
      'labels[2].resourceName',
      'labels[2].labels[1].resourceName',
    ]);
  });

  it('checks that email integration refers to statuses and roles in the document', () => {
    const doc = minimalDoc();
    doc.emailIntegration = {
      enabled: true,
      ignoreAutoReply: true,
      ignoreNoReply: true,
      statusForNew: 'MISSING',
      triggerStatusChangeOn: 'SOLVED',
      inactiveStatus: 'NOPE',
      stakeholderRole: 'NOBODY',
      daysOfInactivityBeforeReject: 1.5,
    };
    expect(errorPaths(doc)).toEqual([
      'emailIntegration.statusForNew',
      'emailIntegration.inactiveStatus',
      'emailIntegration.statusChangeTo',
      'emailIntegration.stakeholderRole',
      'emailIntegration.daysOfInactivityBeforeReject',
    ]);
  });

  it('accepts email integration references that exist in the target namespace under allowExisting', () => {
    const doc = minimalDoc();
    doc.statuses = [];
    doc.roles = [];
    const existing = emptyExisting();
    existing.statuses.add('NEW');
    existing.roles.add('CONTACT');
    expect(errorPaths(doc, existing)).toEqual([]);
    expect(errorPaths(doc)).toEqual(['emailIntegration.statusForNew', 'emailIntegration.stakeholderRole']);
  });

  it('warns when inactiveStatus and daysOfInactivityBeforeReject are not set together', () => {
    const doc = minimalDoc();
    doc.emailIntegration = { ...doc.emailIntegration, inactiveStatus: 'SOLVED' };
    const warnings = validateNamespaceImport(doc).filter(issue => issue.severity === 'warning');
    expect(warnings).toEqual([expect.objectContaining({ path: 'emailIntegration.daysOfInactivityBeforeReject' })]);
  });

  it('rejects duplicate feature flags per application', () => {
    const doc = minimalDoc();
    doc.featureFlags = [
      { name: 'f', description: '', enabled: true, application: 'a' },
      { name: 'f', description: '', enabled: false, application: 'a' },
      { name: 'f', description: '', enabled: false, application: 'b' },
    ];
    expect(errorPaths(doc)).toEqual(['featureFlags[1].name']);
  });

  it('warns about present-but-empty sections', () => {
    const doc = minimalDoc();
    doc.roles = [];
    doc.labels = [];
    const warnings = validateNamespaceImport(doc).filter(issue => issue.severity === 'warning');
    expect(warnings.map(issue => issue.path)).toEqual(['roles', 'labels']);
  });
});

describe('buildImportPlan', () => {
  it('creates everything when the namespace does not exist', () => {
    const plan = buildImportPlan(minimalDoc(), null);
    expect(plan.map(entry => entry.section)).toEqual([...SECTION_ORDER]);
    expect(plan.every(entry => entry.skip === 0)).toBe(true);
    expect(plan.find(entry => entry.section === 'namespaceConfig')).toEqual({ section: 'namespaceConfig', create: 1, skip: 0, skipped: [] });
    expect(plan.find(entry => entry.section === 'statuses')).toEqual({ section: 'statuses', create: 2, skip: 0, skipped: [] });
    expect(plan.find(entry => entry.section === 'labels')).toEqual({ section: 'labels', create: 1, skip: 0, skipped: [] });
  });

  it('skips existing items, existing labels and an existing email integration', () => {
    const existing = emptyExisting();
    existing.statuses.add('NEW');
    existing.contactReasons.add('QUESTION');
    existing.hasLabels = true;
    existing.hasEmailIntegration = true;
    existing.featureFlags.add('draken::flag');

    const plan = buildImportPlan(minimalDoc(), existing);
    const entry = (section: string) => plan.find(item => item.section === section);
    expect(entry('namespaceConfig')).toEqual({ section: 'namespaceConfig', create: 0, skip: 1, skipped: ['NEW_NS'] });
    expect(entry('statuses')).toEqual({ section: 'statuses', create: 1, skip: 1, skipped: ['NEW'] });
    expect(entry('contactReasons')).toEqual({ section: 'contactReasons', create: 0, skip: 1, skipped: ['QUESTION'] });
    expect(entry('labels')).toEqual({ section: 'labels', create: 0, skip: 1, skipped: ['labels'] });
    expect(entry('emailIntegration')).toEqual({ section: 'emailIntegration', create: 0, skip: 1, skipped: ['emailIntegration'] });
    expect(entry('featureFlags')).toEqual({ section: 'featureFlags', create: 0, skip: 1, skipped: ['draken::flag'] });
    expect(entry('roles')).toEqual({ section: 'roles', create: 1, skip: 0, skipped: [] });
  });

  it('plans nothing for sections the document leaves out', () => {
    const doc = minimalDoc();
    delete doc.labels;
    delete doc.emailIntegration;
    delete doc.featureFlags;
    const plan = buildImportPlan(doc, null);
    expect(plan.find(entry => entry.section === 'labels')).toEqual({ section: 'labels', create: 0, skip: 0, skipped: [] });
    expect(plan.find(entry => entry.section === 'emailIntegration')).toEqual({ section: 'emailIntegration', create: 0, skip: 0, skipped: [] });
    expect(plan.find(entry => entry.section === 'featureFlags')).toEqual({ section: 'featureFlags', create: 0, skip: 0, skipped: [] });
  });
});
