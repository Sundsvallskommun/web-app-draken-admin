import 'reflect-metadata';
import { NamespaceRequestDto } from '@/dtos/namespace.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const validateNamespace = (body: object) => validate(plainToInstance(NamespaceRequestDto, body), { forbidUnknownValues: false });

describe('NamespaceRequestDto', () => {
  it('accepts namespaces made of letters, digits, underscores and hyphens', async () => {
    expect(await validateNamespace({ namespace: 'CONTACT_CENTER-2', displayName: 'Kontaktcenter' })).toHaveLength(0);
  });

  it.each(['../OTHER', 'A/B', 'WITH SPACE', ''])('rejects "%s" since it would leave the namespace path segment', async namespace => {
    const errors = await validateNamespace({ namespace });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('namespace');
  });

  it('does not require namespace in the body, since updates take it from the url', async () => {
    expect(await validateNamespace({ displayName: 'Kontaktcenter' })).toHaveLength(0);
  });
});
