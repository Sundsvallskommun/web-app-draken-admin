import {
  emailIntegrationFromTemplate,
  metadataRowsFromTemplate,
  namespaceConfigFromTemplate,
  namespaceTemplateFromRecords,
} from '../namespace-template-mapping';

describe('namespace template mapping', () => {
  it('keeps only the editable keys of active metadata rows', () => {
    const rows = [
      {
        id: 12,
        __key: 'SOURCE/12',
        namespace: 'SOURCE',
        name: 'NEW',
        displayName: 'Ny',
        externalDisplayName: 'Mottagen',
        createdAt: '2026-01-01',
        updatedAt: '2026-02-01',
      },
      { id: 13, namespace: 'SOURCE', name: 'OLD', displayName: 'Gammal', deprecated: true },
    ];

    expect(metadataRowsFromTemplate('statuses', rows)).toEqual([
      { name: 'NEW', displayName: 'Ny', externalDisplayName: 'Mottagen' },
    ]);
    expect(metadataRowsFromTemplate('contactReasons', [{ id: 1, reason: 'PHONE', displayName: null }])).toEqual([
      { reason: 'PHONE', displayName: '' },
    ]);
  });

  it('copies namespace settings but never its identity', () => {
    expect(
      namespaceConfigFromTemplate({
        namespace: 'SOURCE',
        displayName: 'Källa',
        shortCode: 'SRC',
        notificationTTLInDays: 30,
        accessControl: true,
        notifyReporter: false,
      })
    ).toEqual({ notificationTTLInDays: 30, accessControl: true, notifyReporter: false });
  });

  it('copies the email integration switched off, with rich text split for the editor', () => {
    const draft = emailIntegrationFromTemplate(
      {
        id: 'SOURCE',
        namespace: 'SOURCE',
        enabled: true,
        statusForNew: 'NEW',
        errandNewEmailTemplate: 'Hej',
        errandNewEmailHTMLTemplate: '<p>Hej</p>',
        daysOfInactivityBeforeReject: null,
        createdAt: '2026-01-01',
      },
      [{ name: 'NEW', displayName: '', externalDisplayName: '' }]
    );

    expect(draft.configure).toBe(true);
    expect(draft.values).toMatchObject({
      enabled: false,
      statusForNew: 'NEW',
      errandNewEmailBody: { plainText: 'Hej', markup: '<p>Hej</p>' },
      daysOfInactivityBeforeReject: '',
    });
    expect(draft.values).not.toHaveProperty('createdAt');
  });

  it('leaves the email integration off when the source has none', () => {
    expect(emailIntegrationFromTemplate(undefined, []).configure).toBe(false);
  });

  it('builds a whole template with label ids stripped', () => {
    const template = namespaceTemplateFromRecords({
      labels: [{ id: 'a', classification: 'CATEGORY', resourceName: 'HOUSING', labels: [] }],
    });

    expect(template.labels).toEqual([{ classification: 'CATEGORY', resourceName: 'HOUSING', labels: [] }]);
    expect(template.statuses).toEqual([]);
    expect(template.namespaceConfig).toEqual({});
  });
});
