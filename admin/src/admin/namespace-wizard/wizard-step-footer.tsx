import { Button } from '@components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WIZARD_STEP_FORM_ID } from './namespace-wizard-context';

/** Tillbaka/Nästa for the current step. Nästa submits the step's form, which validates before moving on. */
export function WizardStepFooter({ canGoBack, onBack }: { canGoBack: boolean; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 border-t pt-6">
      <Button type="button" variant="outline" onClick={onBack} disabled={!canGoBack}>
        <ArrowLeft className="size-4" />
        Tillbaka
      </Button>
      <Button type="submit" form={WIZARD_STEP_FORM_ID} className="ml-auto">
        Nästa
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
