import {
  validateEmailIntegrationDraft,
  validateLabelTree,
  validateMetadataRows,
  validateNamespaceConfig,
  validateStep,
} from '../namespace-wizard-validation';
import { createInitialDraft } from '../namespace-wizard-reducer';

const context = {
  existing: { namespaces: ['TAKEN', 'SBK_MEX'], shortCodes: [{ shortCode: 'TK', namespace: 'TAKEN' }] },
};

const validNamespace = { namespace: 'NEW_NS', displayName: 'Nytt', shortCode: 'NN', notificationTTLInDays: 40 };

describe('validateNamespaceConfig', () => {
  it('accepts a new namespace', () => {
    expect(validateNamespaceConfig(validNamespace, context)).toEqual({});
  });

  it('requires the identity fields', () => {
    expect(
      validateNamespaceConfig({ namespace: '', displayName: ' ', shortCode: '', notificationTTLInDays: '' }, context)
    ).toEqual({
      namespace: 'Namespace är obligatoriskt',
      displayName: 'Visningsnamn är obligatoriskt',
      shortCode: 'Kortkod är obligatoriskt',
      notificationTTLInDays: 'Notis-TTL (dagar) är obligatoriskt',
    });
  });

  it('rejects malformed values', () => {
    expect(
      validateNamespaceConfig(
        { ...validNamespace, namespace: 'new-ns', shortCode: 'N_N', notificationTTLInDays: 0 },
        context
      )
    ).toEqual({
      namespace: 'Namespace får bara innehålla A–Z, 0–9 och _.',
      shortCode: 'Kortkoden får bara innehålla A–Z och 0–9.',
      notificationTTLInDays: 'Ange ett heltal som är minst 1.',
    });
  });

  it('rejects names and short codes that are already used', () => {
    expect(validateNamespaceConfig({ ...validNamespace, namespace: 'SBK_MEX', shortCode: 'TK' }, context)).toEqual({
      namespace: 'Namespace "SBK_MEX" finns redan.',
      shortCode: 'Kortkoden "TK" används redan av TAKEN.',
    });
  });

  it('does not count the namespace this wizard created as taken', () => {
    expect(
      validateNamespaceConfig(
        { ...validNamespace, namespace: 'TAKEN', shortCode: 'TK' },
        { ...context, createdNamespace: 'TAKEN' }
      )
    ).toEqual({});
  });
});

describe('validateMetadataRows', () => {
  it('requires keys, the fields the backend requires and unique names', () => {
    const validation = validateMetadataRows('roles', [
      { name: 'ADMIN', displayName: 'Admin' },
      { name: 'admin', displayName: '' },
      { name: '', displayName: 'Utan namn' },
    ]);

    expect(validation.rows).toEqual({
      1: { name: 'Roll "admin" finns redan.', displayName: 'Visningsnamn är obligatoriskt' },
      2: { name: 'Namn är obligatoriskt' },
    });
  });

  it('can require at least one row', () => {
    expect(validateMetadataRows('statuses', [], { requireAtLeastOne: true }).list).toBe('Lägg till minst en status.');
    expect(validateMetadataRows('contactReasons', []).list).toBeUndefined();
  });
});

describe('validateLabelTree', () => {
  it('reports invalid resource names and duplicates among siblings', () => {
    expect(
      validateLabelTree([
        { classification: 'CATEGORY', resourceName: 'HOUSING', displayName: 'Boende', labels: [] },
        { classification: 'CATEGORY', resourceName: 'HOUSING', displayName: 'Bostad', labels: [] },
        { classification: '', resourceName: 'bad name', displayName: 'Fel', labels: [] },
      ])
    ).toEqual([
      'Resursnamnet HOUSING finns två gånger under rotnivån.',
      'Etiketten Fel saknar klassificering.',
      'Etiketten Fel har ett ogiltigt resursnamn (A–Z, 0–9 och _).',
    ]);
  });
});

describe('validateEmailIntegrationDraft', () => {
  const statuses = [{ name: 'NEW' }, { name: 'SOLVED' }];
  const roles = [{ name: 'CONTACT' }];

  it('is not checked when no email integration is configured', () => {
    expect(validateEmailIntegrationDraft({ configure: false, values: {} }, statuses, roles)).toEqual({});
  });

  it('only allows statuses and roles from the wizard', () => {
    expect(
      validateEmailIntegrationDraft(
        { configure: true, values: { statusForNew: 'OPEN', stakeholderRole: 'BOSS' } },
        statuses,
        roles
      )
    ).toEqual({
      statusForNew: 'Statusen "OPEN" finns inte bland statusarna i steg 2.',
      stakeholderRole: 'Rollen "BOSS" finns inte bland rollerna i steg 2.',
    });
  });

  it('enforces the rules between the fields', () => {
    expect(
      validateEmailIntegrationDraft(
        {
          configure: true,
          values: {
            statusForNew: '',
            triggerStatusChangeOn: 'SOLVED',
            statusChangeTo: '',
            daysOfInactivityBeforeReject: '14',
            inactiveStatus: '',
            addSenderAsStakeholder: true,
            stakeholderRole: '',
            errandNewEmailSender: 'not-an-email',
          },
        },
        statuses,
        roles
      )
    ).toEqual({
      statusForNew: 'Status för nya ärenden är obligatoriskt',
      statusChangeTo: 'Ange vilken status ärendet ska byta till.',
      inactiveStatus: 'Ange vilken status som räknas som inaktiv.',
      stakeholderRole: 'Ange vilken roll avsändaren ska få.',
      errandNewEmailSender: 'Ange en giltig e-postadress, till exempel namn@domän.se.',
    });
  });
});

describe('validateStep', () => {
  it('prefixes messages with the list they come from', () => {
    const draft = { ...createInitialDraft(2281), statuses: [], roles: [{ name: 'ADMIN', displayName: '' }] };

    expect(validateStep('statusesAndRoles', draft, context)).toEqual([
      'Statusar: Lägg till minst en status.',
      'Roller: Visningsnamn är obligatoriskt',
    ]);
    expect(validateStep('review', draft, context)).toEqual([]);
  });
});
