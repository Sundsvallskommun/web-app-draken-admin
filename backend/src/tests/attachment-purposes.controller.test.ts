import 'reflect-metadata';
import { mapAttachmentPurpose } from '@controllers/attachment-purposes.controller';
import type { AttachmentPurpose as SupportManagementAttachmentPurpose } from '@/data-contracts/supportmanagement/data-contracts';

describe('mapAttachmentPurpose', () => {
  it('maps gateway fields to admin fields and attaches the namespace', () => {
    const purpose: SupportManagementAttachmentPurpose = {
      id: '5f79a808-0ef3-4985-99b9-b12f23e202a7',
      name: 'RESPONSE',
      displayName: 'Inkommen handling',
      sortOrder: 1,
      deprecated: true,
      created: '2000-10-31T01:30:00.000+02:00',
      modified: '2001-10-31T01:30:00.000+02:00',
    };

    expect(mapAttachmentPurpose(purpose, 'CONTACTCENTER')).toEqual({
      id: '5f79a808-0ef3-4985-99b9-b12f23e202a7',
      name: 'RESPONSE',
      displayName: 'Inkommen handling',
      sortOrder: 1,
      deprecated: true,
      namespace: 'CONTACTCENTER',
      createdAt: '2000-10-31T01:30:00.000+02:00',
      updatedAt: '2001-10-31T01:30:00.000+02:00',
    });
  });

  it('normalises nullable gateway values so the admin form gets plain optionals', () => {
    const purpose: SupportManagementAttachmentPurpose = { id: 'id', name: 'OTHER', displayName: null, sortOrder: null };

    expect(mapAttachmentPurpose(purpose, 'NS')).toMatchObject({ displayName: undefined, sortOrder: undefined, deprecated: false });
  });
});
