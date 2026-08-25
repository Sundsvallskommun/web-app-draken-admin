import { requiredRuleFor } from '../resource-form-validation';

describe('resource-form-validation', () => {
  it('accepts false as a valid required switch value', () => {
    const rule = requiredRuleFor({ key: 'ignoreNoReply', label: 'Ignorera no-reply', type: 'switch' }, true);

    expect(rule?.validate?.(false)).toBe(true);
    expect(rule?.validate?.(true)).toBe(true);
    expect(rule?.validate?.(undefined)).toBe('Ignorera no-reply är obligatoriskt');
  });

  it('keeps standard required validation for non-switch fields', () => {
    expect(requiredRuleFor({ key: 'statusForNew', label: 'Status för nya ärenden', type: 'select' }, true)).toEqual({
      required: 'Status för nya ärenden är obligatoriskt',
    });
  });
});
