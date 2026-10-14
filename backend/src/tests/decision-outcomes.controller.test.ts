import 'reflect-metadata';
import { mapDecisionOutcome } from '@controllers/decision-outcomes.controller';
import type { DecisionOutcome as SupportManagementDecisionOutcome } from '@/data-contracts/supportmanagement/data-contracts';

describe('mapDecisionOutcome', () => {
  it('maps gateway fields to admin fields and attaches the namespace', () => {
    const outcome: SupportManagementDecisionOutcome = {
      id: '5f79a808-0ef3-4985-99b9-b12f23e202a7',
      name: 'APPROVED',
      displayName: 'Beviljad',
      sortOrder: 1,
      deprecated: true,
      created: '2000-10-31T01:30:00.000+02:00',
      modified: '2001-10-31T01:30:00.000+02:00',
    };

    expect(mapDecisionOutcome(outcome, 'CONTACTCENTER')).toEqual({
      id: '5f79a808-0ef3-4985-99b9-b12f23e202a7',
      name: 'APPROVED',
      displayName: 'Beviljad',
      sortOrder: 1,
      deprecated: true,
      namespace: 'CONTACTCENTER',
      createdAt: '2000-10-31T01:30:00.000+02:00',
      updatedAt: '2001-10-31T01:30:00.000+02:00',
    });
  });

  it('normalises nullable gateway values so the admin form gets plain optionals', () => {
    const outcome: SupportManagementDecisionOutcome = { id: 'id', name: 'OTHER', displayName: null, sortOrder: null };

    expect(mapDecisionOutcome(outcome, 'NS')).toMatchObject({ displayName: undefined, sortOrder: undefined, deprecated: false });
  });
});
