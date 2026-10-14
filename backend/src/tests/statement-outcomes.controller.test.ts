import 'reflect-metadata';
import { mapStatementOutcome } from '@controllers/statement-outcomes.controller';
import type { StatementOutcome as SupportManagementStatementOutcome } from '@/data-contracts/supportmanagement/data-contracts';

describe('mapStatementOutcome', () => {
  it('maps gateway fields to admin fields and attaches the namespace', () => {
    const outcome: SupportManagementStatementOutcome = {
      id: '5f79a808-0ef3-4985-99b9-b12f23e202a7',
      name: 'NO_RESPONSE',
      displayName: 'Inget svar',
      sortOrder: 1,
      responded: false,
      deprecated: true,
      created: '2000-10-31T01:30:00.000+02:00',
      modified: '2001-10-31T01:30:00.000+02:00',
    };

    expect(mapStatementOutcome(outcome, 'CONTACTCENTER')).toEqual({
      id: '5f79a808-0ef3-4985-99b9-b12f23e202a7',
      name: 'NO_RESPONSE',
      displayName: 'Inget svar',
      sortOrder: 1,
      responded: false,
      deprecated: true,
      namespace: 'CONTACTCENTER',
      createdAt: '2000-10-31T01:30:00.000+02:00',
      updatedAt: '2001-10-31T01:30:00.000+02:00',
    });
  });

  it('normalises nullable gateway values and applies the gateway defaults', () => {
    const outcome: SupportManagementStatementOutcome = { id: 'id', name: 'OTHER', displayName: null, sortOrder: null };

    expect(mapStatementOutcome(outcome, 'NS')).toMatchObject({
      displayName: undefined,
      sortOrder: undefined,
      responded: true,
      deprecated: false,
    });
  });
});
