import { validateCategoryTypes } from './category-types';
import type { FieldDef } from './resource-config';

/** Validation rules for a form field: field-type specific checks, otherwise the required rule. */
export function validationRulesFor(field: FieldDef, required: boolean) {
  if (field.type === 'categoryTypes') return { validate: validateCategoryTypes };
  return requiredRuleFor(field, required);
}

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
