import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { PocLayout } from '@poc/poc-layout';
import { usePocRows } from '@poc/use-poc-rows';
import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

// Approval is stored in the template metadata (testStatus: approved).
function isApproved(metadata: unknown): boolean {
  try {
    const arr = typeof metadata === 'string' ? JSON.parse(metadata || '[]') : Array.isArray(metadata) ? metadata : [];
    return arr.some((e: { key: string; value: string }) => e.key === 'testStatus' && e.value === 'approved');
  } catch {
    return false;
  }
}

export default function TemplateTestStatus() {
  const { rows, loading } = usePocRows('templates');

  return (
    <PocLayout title="Teststatus" breadcrumb="Mallar">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mall</TableHead>
              <TableHead>Identifierare</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Teststatus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {loading ? 'Hämtar…' : 'Inga mallar.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((t) => {
                const approved = isApproved(t.metadata);
                return (
                  <TableRow key={t.__key}>
                    <TableCell className="font-medium">{String(t.name ?? t.identifier)}</TableCell>
                    <TableCell className="text-muted-foreground">{String(t.identifier)}</TableCell>
                    <TableCell className="text-muted-foreground">{t.version != null ? `v${t.version}` : '—'}</TableCell>
                    <TableCell>
                      {approved ? (
                        <Badge>Godkänd för produktion</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Ej godkänd
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </PocLayout>
  );
}
