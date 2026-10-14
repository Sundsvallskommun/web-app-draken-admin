import 'reflect-metadata';
import { mapMeasureType } from '@controllers/measure-types.controller';
import type { MeasureType as SupportManagementMeasureType } from '@/data-contracts/supportmanagement/data-contracts';

describe('mapMeasureType', () => {
  it('maps gateway fields to admin fields and attaches the namespace', () => {
    const measureType: SupportManagementMeasureType = {
      id: '5f79a808-0ef3-4985-99b9-b12f23e202a7',
      name: 'SITE_VISIT',
      displayName: 'Platsbesök',
      measureGroups: ['INSPECTION', 'FOLLOW_UP'],
      sortOrder: 1,
      deprecated: true,
      created: '2000-10-31T01:30:00.000+02:00',
      modified: '2001-10-31T01:30:00.000+02:00',
    };

    expect(mapMeasureType(measureType, 'CONTACTCENTER')).toEqual({
      id: '5f79a808-0ef3-4985-99b9-b12f23e202a7',
      name: 'SITE_VISIT',
      displayName: 'Platsbesök',
      measureGroups: ['INSPECTION', 'FOLLOW_UP'],
      sortOrder: 1,
      deprecated: true,
      namespace: 'CONTACTCENTER',
      createdAt: '2000-10-31T01:30:00.000+02:00',
      updatedAt: '2001-10-31T01:30:00.000+02:00',
    });
  });

  it('normalises nullable gateway values so the admin form gets plain optionals', () => {
    const measureType: SupportManagementMeasureType = { id: 'id', name: 'OTHER', displayName: null, sortOrder: null };

    expect(mapMeasureType(measureType, 'NS')).toMatchObject({
      displayName: undefined,
      measureGroups: [],
      sortOrder: undefined,
      deprecated: false,
    });
  });
});
