import { getEscalationEmail, isEscalationEmailApplicable, setEscalationEmail } from '../label-attributes';

describe('label attributes', () => {
  it('limits the migrated category/type field to TYPE labels', () => {
    expect(isEscalationEmailApplicable('TYPE')).toBe(true);
    expect(isEscalationEmailApplicable(' type ')).toBe(true);
    expect(isEscalationEmailApplicable('CATEGORY')).toBe(false);
    expect(isEscalationEmailApplicable('SUBTYPE')).toBe(false);
  });

  it('reads escalationEmail from free-form label attributes', () => {
    expect(
      getEscalationEmail({
        classification: 'TYPE',
        resourceName: 'WATER_LEAK',
        attributes: [
          { key: 'owner', value: 'service-center' },
          { key: 'escalationEmail', value: 'water@example.com' },
        ],
      })
    ).toBe('water@example.com');
  });

  it('adds and edits escalationEmail without changing other attributes', () => {
    const attributes = [{ key: 'owner', value: 'service-center' }];
    const added = setEscalationEmail(attributes, ' water@example.com ');

    expect(added).toEqual([
      { key: 'owner', value: 'service-center' },
      { key: 'escalationEmail', value: 'water@example.com' },
    ]);
    expect(attributes).toEqual([{ key: 'owner', value: 'service-center' }]);

    expect(setEscalationEmail(added, 'new@example.com')).toEqual([
      { key: 'owner', value: 'service-center' },
      { key: 'escalationEmail', value: 'new@example.com' },
    ]);
  });

  it('removes only escalationEmail when the value is cleared', () => {
    expect(
      setEscalationEmail(
        [
          { key: 'escalationEmail', value: 'water@example.com' },
          { key: 'owner', value: 'service-center' },
        ],
        '   '
      )
    ).toEqual([{ key: 'owner', value: 'service-center' }]);
  });
});
