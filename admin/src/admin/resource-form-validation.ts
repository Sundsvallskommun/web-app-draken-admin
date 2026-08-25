import type { FieldDef } from './resource-config';

export function requiredRuleFor(field: FieldDef, required: boolean) {
  if (!required) return undefined;

  const message = `${field.label} är obligatoriskt`;
  if (field.type === 'switch') {
    return {
      validate: (value: unknown) => (typeof value === 'boolean' ? true : message),
    };
  }

  return { required: message };
}
