import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { errorMessage } from '@utils/error-message';
import { Copy, Loader2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { useNamespaceWizard } from '../namespace-wizard-context';
import { draftHasListContent } from '../namespace-wizard-reducer';
import { loadNamespaceTemplate } from '../namespace-template-loader';

/** Prefills the wizard from an existing supportmanagement namespace. */
export function TemplateNamespacePicker({ disabled }: { disabled?: boolean }) {
  const { state, supportManagementNamespaces, applyTemplate } = useNamespaceWizard();
  const [sourceNamespace, setSourceNamespace] = React.useState(state.draft.templateNamespace ?? '');
  const [loading, setLoading] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const loadTemplate = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const { template, failedParts } = await loadNamespaceTemplate(state.draft.municipalityId, sourceNamespace);
      applyTemplate(sourceNamespace, template);
      if (failedParts.length > 0) toast.warning(`Kunde inte hämta ${failedParts.join(', ')} från ${sourceNamespace}.`);
      else toast.success(`Hämtade inställningar från ${sourceNamespace}.`);
    } catch (error) {
      toast.error(`Kunde inte hämta mallen: ${errorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const requestTemplate = () => {
    if (draftHasListContent(state.draft)) setConfirmOpen(true);
    else void loadTemplate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Utgå från ett befintligt namespace</CardTitle>
        <CardDescription>
          Statusar, roller, kontaktorsaker, etiketter och e-postintegration kopieras och kan ändras i stegen. Namespace,
          visningsnamn och kortkod fylls aldrig i.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Select value={sourceNamespace} onValueChange={setSourceNamespace} disabled={disabled || loading}>
          <SelectTrigger className="w-[18rem]" aria-label="Namespace att utgå från">
            <SelectValue placeholder="Välj namespace" />
          </SelectTrigger>
          <SelectContent>
            {supportManagementNamespaces.map((row) => {
              const namespace = String(row.namespace ?? '');
              return (
                <SelectItem key={namespace} value={namespace}>
                  {row.displayName ? `${row.displayName} (${namespace})` : namespace}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={requestTemplate}
          disabled={!sourceNamespace || disabled || loading}
        >
          {loading ?
            <Loader2 className="size-4 animate-spin" />
          : <Copy className="size-4" />}
          Hämta
        </Button>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ersätta nuvarande innehåll?</AlertDialogTitle>
            <AlertDialogDescription>
              Statusar, roller, kontaktorsaker, etiketter och e-postintegration ersätts med innehållet från{' '}
              {sourceNamespace}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => void loadTemplate()}>Ersätt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
