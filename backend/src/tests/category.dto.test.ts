import 'reflect-metadata';
import { CategoryUpdateDto } from '@/dtos/category.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const toDto = (body: object) => plainToInstance(CategoryUpdateDto, body);

describe('CategoryUpdateDto', () => {
  it('accepts types without an escalation email and leaves the blank value out of the payload', async () => {
    const dto = toDto({
      types: [
        { name: 'RENT', escalationEmail: 'rent@example.com', deprecated: false },
        { name: 'KEYS', escalationEmail: '', deprecated: true },
        { name: 'PARKING', escalationEmail: '   ' },
      ],
    });

    expect(await validate(dto, { forbidUnknownValues: false })).toHaveLength(0);
    expect(JSON.parse(JSON.stringify(dto.types))).toEqual([
      { name: 'RENT', escalationEmail: 'rent@example.com', deprecated: false },
      { name: 'KEYS', deprecated: true },
      { name: 'PARKING' },
    ]);
  });

  it('still rejects an invalid escalation email', async () => {
    const errors = await validate(toDto({ types: [{ name: 'RENT', escalationEmail: 'not-an-email' }] }), {
      forbidUnknownValues: false,
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('types');
  });

  it('does not require namespace in the body, since updates take it from the url', async () => {
    expect(await validate(toDto({ displayName: 'Hyra', deprecated: true }), { forbidUnknownValues: false })).toHaveLength(0);
  });
});
