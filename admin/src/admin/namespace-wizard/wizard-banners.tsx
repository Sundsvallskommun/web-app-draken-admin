import { Button } from '@components/ui/button';
import { municipalityName } from '@utils/municipalities';
import { History, TriangleAlert, X } from 'lucide-react';
import { useNamespaceWizard } from './namespace-wizard-context';

function RestoredDraftBanner() {
  const { resetWizard, dismissRestoredDraft } = useNamespaceWizard();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/50 px-3 py-2 text-sm">
      <History className="size-4 shrink-0 text-muted-foreground" />
      <span>Ett sparat utkast återställdes.</span>
      <div className="ml-auto flex items-center gap-1">
        <Button type="button" size="sm" variant="outline" onClick={resetWizard}>
          Börja om
        </Button>
        <Button type="button" size="icon" variant="ghost" aria-label="Stäng" onClick={dismissRestoredDraft}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MunicipalityChangedBanner() {
  const { state, liveMunicipalityId, resetWizard, submission } = useNamespaceWizard();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/20 dark:text-amber-100">
      <TriangleAlert className="size-4 shrink-0" />
      <span>
        Guiden startades för {municipalityName(state.draft.municipalityId)}, men {municipalityName(liveMunicipalityId)}{' '}
        är vald i menyn.
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="ml-auto"
        onClick={resetWizard}
        disabled={submission.running}
      >
        Börja om för {municipalityName(liveMunicipalityId)}
      </Button>
    </div>
  );
}

export function WizardBanners() {
  const { state, liveMunicipalityId, restoredDraft } = useNamespaceWizard();
  return (
    <>
      {restoredDraft && <RestoredDraftBanner />}
      {state.draft.municipalityId !== liveMunicipalityId && <MunicipalityChangedBanner />}
    </>
  );
}
