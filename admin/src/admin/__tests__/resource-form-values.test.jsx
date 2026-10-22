import { getResourceConfig } from '../resource-config';
import { defaultFieldValues, normalizeResourceValues } from '../resource-form-values';

const emailIntegration = getResourceConfig('emailIntegration');
const namespaces = getResourceConfig('namespaces');

describe('resource form values', () => {
  it('reads rich text fields from their plain text and markup api fields', () => {
    const values = defaultFieldValues(
      emailIntegration.fields,
      { id: 'SBK', errandNewEmailTemplate: 'Hej', errandNewEmailHTMLTemplate: '<p>Hej</p>' },
      {}
    );

    expect(values.errandNewEmailBody).toEqual({ plainText: 'Hej', markup: '<p>Hej</p>' });
    expect(values.enabled).toBe(false);
    expect(values.daysOfInactivityBeforeReject).toBe('');
  });

  it('uses defaults for fields the record does not have', () => {
    expect(defaultFieldValues(namespaces.fields, undefined, { notificationTTLInDays: 40 })).toMatchObject({
      namespace: '',
      notificationTTLInDays: 40,
      accessControl: false,
    });
  });

  it('splits rich text back into its api fields and coerces numbers', () => {
    const normalized = normalizeResourceValues(emailIntegration, {
      errandNewEmailBody: { plainText: 'Hej', markup: '<p>Hej</p>' },
      daysOfInactivityBeforeReject: '14',
      statusForNew: 'NEW',
    });

    expect(normalized).toMatchObject({
      errandNewEmailTemplate: 'Hej',
      errandNewEmailHTMLTemplate: '<p>Hej</p>',
      daysOfInactivityBeforeReject: 14,
      statusForNew: 'NEW',
    });
    expect(normalized).not.toHaveProperty('errandNewEmailBody');
  });

  it('leaves an empty number out instead of sending 0', () => {
    expect(normalizeResourceValues(namespaces, { notificationTTLInDays: '' }).notificationTTLInDays).toBeUndefined();
  });
});
