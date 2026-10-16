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
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { AdminLayout } from '@admin/admin-layout';
import { MonacoField } from '@admin/monaco-field';
import { NamespaceDeleteCard } from '@admin/namespace-delete-card';
import { NamespaceImportReportView } from '@admin/namespace-import-report';
import type { Namespace, NamespaceImportDto, NamespaceImportReport } from '@data-contracts/backend/data-contracts';
import { exportNamespace, importNamespace, listSupportManagementNamespaces } from '@services/namespace-import-service';
import { downloadJson, readTextFile } from '@utils/download-json';
import { useAdminEnvironment } from '@utils/use-is-production-env.hook';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Download, FileJson, Loader2, ShieldCheck, Upload } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

const errMsg = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? 'fel';
};

type Parsed = { ok: true; document: NamespaceImportDto } | { ok: false; error: string };

/** Parses the editor text and applies the optional namespace override. Validation itself happens in the backend. */
function parseDocument(text: string, namespaceOverride: string): Parsed {
  if (!text.trim()) return { ok: false, error: 'Klistra in eller välj ett JSON-dokument först.' };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (err) {
    return { ok: false, error: `Ogiltig JSON: ${(err as Error).message}` };
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Dokumentet måste vara ett JSON-objekt.' };
  }
  const document = { ...(value as NamespaceImportDto) };
  if (namespaceOverride.trim()) document.namespace = namespaceOverride.trim();
  return { ok: true, document };
}

export default function NamespaceImportPage() {
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const { isProduction } = useAdminEnvironment();

  // Export
  const [namespaces, setNamespaces] = React.useState<Namespace[]>([]);
  const [exportNs, setExportNs] = React.useState('');
  const [exporting, setExporting] = React.useState(false);

  // Import
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState('');
  const [sourceName, setSourceName] = React.useState<string | null>(null);
  const [namespaceOverride, setNamespaceOverride] = React.useState('');
  const [allowExisting, setAllowExisting] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<NamespaceImportReport | null>(null);
  const [validatedKey, setValidatedKey] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<'validate' | 'import' | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const loadNamespaces = React.useCallback(() => {
    let cancelled = false;
    listSupportManagementNamespaces(municipalityId)
      .then((list) => {
        if (!cancelled) setNamespaces(list);
      })
      .catch(() => {
        if (!cancelled) setNamespaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, [municipalityId]);

  React.useEffect(loadNamespaces, [loadNamespaces]);

  // Anything that changes what would be sent invalidates the dry run.
  const currentKey = JSON.stringify({ text, namespaceOverride, allowExisting, municipalityId });
  const canImport = report?.outcome === 'valid' && validatedKey === currentKey && busy === null;
  const targetNamespace = namespaceOverride.trim() || report?.namespace || '';

  const loadExport = async (): Promise<NamespaceImportDto | null> => {
    if (!exportNs) return null;
    setExporting(true);
    try {
      return await exportNamespace(municipalityId, exportNs);
    } catch (err) {
      toast.error(`Kunde inte exportera ${exportNs}: ${errMsg(err)}`);
      return null;
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async () => {
    const document = await loadExport();
    if (document) {
      downloadJson(`namespace-${document.namespace}.json`, document);
      toast.success(`${document.namespace} exporterades.`);
    }
  };

  const handleOpenInEditor = async () => {
    const document = await loadExport();
    if (document) {
      setText(JSON.stringify(document, null, 2));
      setSourceName(`export av ${document.namespace}`);
      setReport(null);
      setParseError(null);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setText(await readTextFile(file));
      setSourceName(file.name);
      setReport(null);
      setParseError(null);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const run = async (mode: 'validate' | 'import') => {
    const parsed = parseDocument(text, namespaceOverride);
    if (!parsed.ok) {
      setParseError(parsed.error);
      setReport(null);
      return;
    }
    setParseError(null);
    setBusy(mode);
    const key = currentKey;
    try {
      const result = await importNamespace(municipalityId, parsed.document, {
        dryRun: mode === 'validate',
        allowExisting,
      });
      setReport(result);
      setValidatedKey(mode === 'validate' ? key : null);
      if (mode === 'import') {
        if (result.outcome === 'completed') toast.success(`Namespacet ${result.namespace} importerades.`);
        else if (result.outcome === 'partial_failure') toast.error('Importen avbröts. Se resultatet nedan.');
        else toast.error('Importen genomfördes inte. Se valideringsresultatet nedan.');
      }
    } catch (err) {
      toast.error(`${mode === 'validate' ? 'Valideringen' : 'Importen'} misslyckades: ${errMsg(err)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout title="Importera / exportera namespace" breadcrumb="Namespaces">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-4" aria-hidden="true" />
              Exportera befintligt namespace
            </CardTitle>
            <CardDescription>
              Hämtar konfiguration, metadata, etiketter, e-postintegration och feature-flaggor som ett JSON-dokument i samma
              format som importen tar emot.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="min-w-64 space-y-1.5">
              <Label htmlFor="export-namespace">Namespace</Label>
              <Select value={exportNs} onValueChange={setExportNs}>
                <SelectTrigger id="export-namespace">
                  <SelectValue placeholder="Välj namespace" />
                </SelectTrigger>
                <SelectContent>
                  {namespaces.map((ns) => (
                    <SelectItem key={ns.namespace} value={ns.namespace}>
                      {ns.displayName ? `${ns.displayName} (${ns.namespace})` : ns.namespace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" disabled={!exportNs || exporting} onClick={handleDownload}>
              {exporting ?
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              : <Download className="size-4" aria-hidden="true" />}
              Ladda ner JSON
            </Button>
            <Button type="button" variant="outline" disabled={!exportNs || exporting} onClick={handleOpenInEditor}>
              <FileJson className="size-4" aria-hidden="true" />
              Öppna i editorn
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-4" aria-hidden="true" />
              Importera namespace
            </CardTitle>
            <CardDescription>
              Validera dokumentet först. Inget skrivs förrän du bekräftar importen. Sektionerna skapas i ordning och
              importen stannar vid första felet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" aria-hidden="true" />
                Välj fil
              </Button>
              <span className="text-sm text-muted-foreground">
                {sourceName ? `Källa: ${sourceName}` : 'Välj en JSON-fil eller klistra in dokumentet nedan.'}
              </span>
            </div>

            <MonacoField
              value={text}
              language="json"
              disabled={busy !== null}
              onChange={(value) => {
                setText(value);
                if (sourceName && !sourceName.startsWith('redigerad')) setSourceName(`redigerad (${sourceName})`);
              }}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="namespace-override">Importera som namespace (valfritt)</Label>
                <Input
                  id="namespace-override"
                  value={namespaceOverride}
                  placeholder="Lämna tomt för att använda dokumentets namespace"
                  onChange={(event) => setNamespaceOverride(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 md:pt-6">
                <Switch id="allow-existing" checked={allowExisting} onCheckedChange={setAllowExisting} />
                <Label htmlFor="allow-existing" className="font-normal">
                  Tillåt befintligt namespace (skapa bara det som saknas)
                </Label>
              </div>
            </div>

            {parseError && (
              <p role="alert" className="text-sm text-destructive">
                {parseError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" disabled={busy !== null || !text.trim()} onClick={() => run('validate')}>
                {busy === 'validate' ?
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <ShieldCheck className="size-4" aria-hidden="true" />}
                Validera
              </Button>
              <Button type="button" disabled={!canImport} onClick={() => setConfirmOpen(true)}>
                {busy === 'import' ?
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <Upload className="size-4" aria-hidden="true" />}
                Importera
              </Button>
              {report?.outcome === 'valid' && validatedKey !== currentKey && (
                <span className="text-sm text-muted-foreground">Dokumentet har ändrats sedan valideringen. Validera igen.</span>
              )}
            </div>

            {report && <NamespaceImportReportView report={report} />}
          </CardContent>
        </Card>

        <NamespaceDeleteCard
          municipalityId={municipalityId}
          namespaces={namespaces}
          isProduction={isProduction}
          onDeleted={() => {
            setExportNs('');
            loadNamespaces();
          }}
        />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={isProduction ? 'text-destructive' : undefined}>
              {isProduction ? `Importera ${targetNamespace} till produktion?` : `Importera ${targetNamespace}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isProduction ?
                'Du är på väg att skapa data i produktionsmiljön. Importen kan inte ångras automatiskt.'
              : 'Sektionerna i planen skapas i ordning. Importen kan inte ångras automatiskt, men du kan köra om den med "Tillåt befintligt namespace" om något går fel.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className={isProduction ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
              onClick={() => {
                setConfirmOpen(false);
                void run('import');
              }}
            >
              Importera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
