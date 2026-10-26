import 'reflect-metadata';
import { RawNamespaceData, emailIntegrationToExport, labelToExport, toExportDocument } from '@/utils/namespace-export-mapper';
import { validateNamespaceImport, validateStructure } from '@/utils/namespace-import-validation';

const raw = (): RawNamespaceData => ({
  config: {
    namespace: 'CONTACTCENTER',
    municipalityId: '2281',
    displayName: 'Kontaktcenter',
    shortCode: 'KC',
    notificationTTLInDays: 40,
    accessControl: false,
    notifyReporter: true,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  statuses: [{ id: 's1', name: 'NEW', displayName: 'Ny', externalDisplayName: null, created: 'x', modified: 'y' }],
  roles: [{ id: 'r1', name: 'CONTACT', displayName: 'Kontakt', created: 'x' }],
  categories: [
    {
      id: 'c1',
      name: 'CAT',
      displayName: 'Kategori',
      sortOrder: 1,
      types: [{ name: 'TYPE', displayName: 'Typ', escalationEmail: 'cat@example.com', created: 'x', modified: 'y' }],
      created: 'x',
    },
  ],
  contactReasons: [{ id: 'cr1', reason: 'QUESTION', displayName: null }],
  attachmentPurposes: [{ id: 'ap1', name: 'EVIDENCE', deprecated: false }],
  measureTypes: [{ id: 'mt1', name: 'VISIT', measureGroups: ['INSPECTION'], sortOrder: null }],
  decisionOutcomes: [{ id: 'do1', name: 'APPROVED' }],
  statementOutcomes: [{ id: 'so1', name: 'ANSWERED', responded: true }],
  labels: [
    {
      id: 'l1',
      version: 3,
      classification: 'CATEGORY',
      classificationDisplayName: 'Kategori',
      displayName: 'Rot',
      resourceName: 'ROOT',
      resourcePath: 'ROOT',
      deprecated: false,
      labels: [
        {
          id: 'l2',
          classification: 'TYPE',
          resourceName: 'LEAF',
          resourcePath: 'ROOT/LEAF',
          labels: [],
          attributes: [{ key: 'escalationEmail', value: 'leaf@example.com' }],
        },
      ],
      attributes: [],
    },
  ],
  emailIntegration: {
    enabled: true,
    errandClosedEmailSender: 'noreply@example.com',
    errandClosedEmailTemplate: 'Stängd',
    errandClosedEmailHTMLTemplate: '<p>Stängd</p>',
    errandNewEmailSender: null,
    errandNewEmailTemplate: null,
    errandNewEmailHTMLTemplate: null,
    daysOfInactivityBeforeReject: '5',
    statusForNew: 'NEW',
    triggerStatusChangeOn: null,
    statusChangeTo: null,
    inactiveStatus: null,
    addSenderAsStakeholder: 'true',
    stakeholderRole: 'CONTACT',
    errandChannel: 'EMAIL',
    ignoreAutoReply: true,
    ignoreNoReply: false,
    created: 'x',
    modified: 'y',
  },
  featureFlags: [
    {
      id: 7,
      name: 'flag',
      description: 'En flagga',
      value: null,
      enabled: true,
      application: 'draken',
      namespace: 'CONTACTCENTER',
      municipalityId: 2281,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
});

describe('toExportDocument', () => {
  it('produces a document that passes structural and semantic validation (round-trip)', () => {
    const doc = toExportDocument('CONTACTCENTER', raw(), new Date('2024-06-01T12:00:00Z'));
    expect(validateStructure(doc)).toEqual([]);
    expect(validateNamespaceImport(doc).filter(issue => issue.severity === 'error')).toEqual([]);
    expect(doc.formatVersion).toBe('1');
    expect(doc.exportedAt).toBe('2024-06-01T12:00:00.000Z');
    expect(doc.namespace).toBe('CONTACTCENTER');
  });

  it('strips ids, timestamps, derived label fields and null values', () => {
    const doc = toExportDocument('CONTACTCENTER', raw());
    expect(doc.config).toEqual({
      displayName: 'Kontaktcenter',
      shortCode: 'KC',
      notificationTTLInDays: 40,
      accessControl: false,
      notifyReporter: true,
    });
    expect(doc.statuses).toEqual([{ name: 'NEW', displayName: 'Ny' }]);
    expect(doc.categories[0]).toEqual({
      name: 'CAT',
      displayName: 'Kategori',
      sortOrder: 1,
      types: [{ name: 'TYPE', displayName: 'Typ', escalationEmail: 'cat@example.com' }],
    });
    expect(doc.contactReasons).toEqual([{ reason: 'QUESTION' }]);
    expect(doc.measureTypes).toEqual([{ name: 'VISIT', measureGroups: ['INSPECTION'] }]);
    expect(doc.labels).toEqual([
      {
        classification: 'CATEGORY',
        resourceName: 'ROOT',
        displayName: 'Rot',
        deprecated: false,
        labels: [{ classification: 'TYPE', resourceName: 'LEAF', attributes: [{ key: 'escalationEmail', value: 'leaf@example.com' }] }],
      },
    ]);
    expect(doc.featureFlags).toEqual([{ name: 'flag', description: 'En flagga', enabled: true, application: 'draken' }]);
  });

  it('converts the email integration strings back to number and boolean', () => {
    const doc = toExportDocument('CONTACTCENTER', raw());
    expect(doc.emailIntegration).toEqual({
      enabled: true,
      errandClosedEmailSender: 'noreply@example.com',
      errandClosedEmailTemplate: 'Stängd',
      errandClosedEmailHTMLTemplate: '<p>Stängd</p>',
      daysOfInactivityBeforeReject: 5,
      statusForNew: 'NEW',
      addSenderAsStakeholder: true,
      stakeholderRole: 'CONTACT',
      errandChannel: 'EMAIL',
      ignoreAutoReply: true,
      ignoreNoReply: false,
    });
  });

  it('omits emailIntegration when the gateway has none', () => {
    const doc = toExportDocument('CONTACTCENTER', { ...raw(), emailIntegration: null });
    expect('emailIntegration' in doc).toBe(false);
    expect(validateStructure(doc)).toEqual([]);
  });

  it('emits empty arrays for empty sections', () => {
    const doc = toExportDocument('CONTACTCENTER', { ...raw(), roles: [], labels: [], featureFlags: [] });
    expect(doc.roles).toEqual([]);
    expect(doc.labels).toEqual([]);
    expect(doc.featureFlags).toEqual([]);
  });
});

describe('labelToExport', () => {
  it('omits empty child lists and attribute lists', () => {
    expect(labelToExport({ id: 'x', classification: 'TYPE', resourceName: 'A', labels: [], attributes: [] })).toEqual({
      classification: 'TYPE',
      resourceName: 'A',
    });
  });
});

describe('emailIntegrationToExport', () => {
  it('keeps already typed values and drops an empty days string', () => {
    const doc = emailIntegrationToExport({
      enabled: false,
      statusForNew: 'NEW',
      ignoreAutoReply: true,
      ignoreNoReply: true,
      daysOfInactivityBeforeReject: '',
      addSenderAsStakeholder: 'false',
    });
    expect(doc).toEqual({ enabled: false, statusForNew: 'NEW', ignoreAutoReply: true, ignoreNoReply: true, addSenderAsStakeholder: false });
  });
});
