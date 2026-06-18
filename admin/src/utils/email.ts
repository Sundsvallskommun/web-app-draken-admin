// Requires a value of the form local@domain.tld, i.e. the domain must contain a dot.
// Matches the backend's class-validator @IsEmail() check so forms fail fast instead of a 400.
export const EMAIL_WITH_TLD_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean => EMAIL_WITH_TLD_REGEX.test(value);
