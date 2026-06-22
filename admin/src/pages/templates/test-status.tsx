import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { AdminLayout } from '@admin/admin-layout';
import { type ResourceRow } from '@admin/resource-config';
import { fetchResourceRecord, updateRow, useResourceRows } from '@admin/use-resource-data';
import { approveTemplateMetadata, getApprovalTimestamp, isTemplateApproved } from '@utils/template-metadata';
import { useIsProductionEnv } from '@utils/use-is-production-env.hook';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'sonner';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

function asJsonString(value: unknown, fallback: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? fallback, null, 2);
}

export default function TemplateTestStatus() {
  const router = useRouter();
  const municipalityId = useLocalStorage((s) => s.municipalityId);
  const { showTestFeatures } = useIsProductionEnv();
  const { rows, loading, refresh } = useResourceRows('templates');
  const [approvingIdentifier, setApprovingIdentifier] = React.useState<string | null>(null);

  const openTemplate = (identifier: unknown) => {
    if (!identifier) return;
    router.push(`/templates/${encodeURIComponent(String(identifier))}`);
  };

  const approveTemplate = async (event: React.MouseEvent<HTMLButtonElement>, row: ResourceRow) => {
    event.stopPropagation();
    const identifier = String(row.identifier ?? '');
    if (!identifier) {
      toast.error('Mallen saknar identifierare.');
      return;
    }

    setApprovingIdentifier(identifier);
    try {
      const template = await fetchResourceRecord('templates', municipalityId, identifier);
      if (!template) throw new Error('not-found');

      await updateRow('templates', municipalityId, template, {
        identifier,
        name: template.name ?? row.name ?? identifier,
        description: template.description ?? '',
        content: template.content ?? '',
        metadata: JSON.stringify(approveTemplateMetadata(template.metadata), null, 2),
        defaultValues: asJsonString(template.defaultValues, []),
        versionIncrement: 'MINOR',
        changeLog: '',
      });

      toast.success(`${template.name ?? identifier} godkändes för produktion.`);
      refresh();
    } catch {
      toast.error(`Kunde inte godkänna ${identifier}.`);
    } finally {
      setApprovingIdentifier(null);
    }
  };

  return (
    <AdminLayout title="Teststatus" breadcrumb="Mallar">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mall</TableHead>
              <TableHead>Identifierare</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Teststatus</TableHead>
              <TableHead className="text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {loading ? 'Hämtar…' : 'Inga mallar.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((t) => {
                const approved = isTemplateApproved(t.metadata);
                const approvedAt = getApprovalTimestamp(t.metadata);
                const identifier = String(t.identifier ?? '');
                const approving = approvingIdentifier === identifier;
                return (
                  <TableRow
                    key={t.__key}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => openTemplate(t.identifier)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openTemplate(t.identifier);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{String(t.name ?? t.identifier)}</TableCell>
                    <TableCell className="text-muted-foreground">{String(t.identifier)}</TableCell>
                    <TableCell className="text-muted-foreground">{t.version != null ? `v${t.version}` : '—'}</TableCell>
                    <TableCell>
                      {approved ? (
                        <div className="flex flex-col items-start gap-1">
                          <Badge>Godkänd för produktion</Badge>
                          {approvedAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(approvedAt).toLocaleString('sv-SE')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Ej godkänd
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {showTestFeatures && !approved && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={approving}
                          onClick={(event) => approveTemplate(event, t)}
                        >
                          {approving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                          Godkänn
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
