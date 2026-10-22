import type { WizardStepId } from './namespace-wizard-types';

export interface WizardStep {
  id: WizardStepId;
  title: string;
  description: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 'namespace', title: 'Namespace', description: 'Namn, kortkod och grundinställningar.' },
  { id: 'statusesAndRoles', title: 'Statusar och roller', description: 'Ärendestatusar och behörighetsroller.' },
  {
    id: 'contactReasonsAndLabels',
    title: 'Kontaktorsaker och etiketter',
    description: 'Orsaker till kontakt och etikettträdet för ärenden.',
  },
  { id: 'emailIntegration', title: 'E-postintegration', description: 'Inkommande e-post som skapar ärenden.' },
  { id: 'review', title: 'Granska och skapa', description: 'Kontrollera allt och skapa namespacet.' },
];

export const stepIndex = (stepId: WizardStepId) => WIZARD_STEPS.findIndex((step) => step.id === stepId);

export const nextStepId = (stepId: WizardStepId): WizardStepId =>
  WIZARD_STEPS[Math.min(stepIndex(stepId) + 1, WIZARD_STEPS.length - 1)].id;

export const previousStepId = (stepId: WizardStepId): WizardStepId =>
  WIZARD_STEPS[Math.max(stepIndex(stepId) - 1, 0)].id;
