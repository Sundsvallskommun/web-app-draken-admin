import { Transform } from 'class-transformer';

/**
 * Treats a blank string as an omitted value, so `@IsOptional()` validators skip it
 * and the field is left out of the payload sent onwards instead of being sent as ''.
 */
export const EmptyStringToUndefined = () => Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value));
