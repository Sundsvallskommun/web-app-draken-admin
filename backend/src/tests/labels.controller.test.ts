import 'reflect-metadata';
import { mapLabel } from '@controllers/labels.controller';
import type { Label as SupportManagementLabel } from '@/data-contracts/supportmanagement/data-contracts';

describe('mapLabel', () => {
  it('keeps deprecated flags from support management labels recursively', () => {
    const label: SupportManagementLabel = {
      id: 'category-id',
      classification: 'CATEGORY',
      displayName: 'RootTest',
      resourceName: 'ROOTTEST',
      resourcePath: 'ROOTTEST',
      deprecated: true,
      labels: [
        {
          id: 'type-id',
          classification: 'TYPE',
          displayName: 'TypeTest',
          resourceName: 'TYPETEST',
          resourcePath: 'ROOTTEST/TYPETEST',
          deprecated: true,
          labels: [],
          attributes: [{ key: 'escalationEmail', value: 'rent@example.com' }],
        },
      ],
      attributes: [{ key: 'owner', value: 'contact-center' }],
    };

    expect(mapLabel(label)).toMatchObject({
      id: 'category-id',
      deprecated: true,
      attributes: [{ key: 'owner', value: 'contact-center' }],
      labels: [
        {
          id: 'type-id',
          deprecated: true,
          attributes: [{ key: 'escalationEmail', value: 'rent@example.com' }],
        },
      ],
    });
  });
});
