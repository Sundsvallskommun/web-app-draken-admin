import 'reflect-metadata';
import { toEmailIntegrationPayload } from '@controllers/email-integration.controller';
import { EmailIntegrationDto } from '@/dtos/email-integration.dto';

describe('toEmailIntegrationPayload', () => {
  it('serialises number and boolean fields to the strings supportmanagement expects', () => {
    const body: EmailIntegrationDto = {
      enabled: true,
      statusForNew: 'NEW',
      daysOfInactivityBeforeReject: 14,
      addSenderAsStakeholder: false,
      stakeholderRole: 'CONTACT',
      ignoreAutoReply: true,
      ignoreNoReply: false,
    };

    expect(toEmailIntegrationPayload(body)).toMatchObject({
      enabled: true,
      statusForNew: 'NEW',
      daysOfInactivityBeforeReject: '14',
      addSenderAsStakeholder: 'false',
      stakeholderRole: 'CONTACT',
      ignoreAutoReply: true,
      ignoreNoReply: false,
    });
  });

  it('leaves optional fields undefined when they are not set', () => {
    const payload = toEmailIntegrationPayload({
      enabled: false,
      statusForNew: 'NEW',
      ignoreAutoReply: false,
      ignoreNoReply: false,
    });

    expect(payload.daysOfInactivityBeforeReject).toBeUndefined();
    expect(payload.addSenderAsStakeholder).toBeUndefined();
    expect(payload.triggerStatusChangeOn).toBeUndefined();
  });
});
