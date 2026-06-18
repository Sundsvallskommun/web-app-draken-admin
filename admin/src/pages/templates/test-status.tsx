import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { PocLayout } from '@poc/poc-layout';
import { getPocResource } from '@poc/poc-resources';

const templates = getPocResource('templates')?.rows ?? [];

// Mocked approval status per template.
const status: Record<string, 'approved' | 'pending' | 'rejected'> = {
  'errand.confirmation': 'approved',
  'errand.closed': 'pending',
  'decision.letter': 'rejected',
};

const labels = {
  approved: { text: 'Godkänd för produktion', variant: 'default' as const },
  pending: { text: 'Väntar på godkännande', variant: 'secondary' as const },
  rejected: { text: 'Ej godkänd', variant: 'destructive' as const },
};

export default function TemplateTestStatus() {
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
            {templates.map((t) => {
              const s = labels[status[t.id] ?? 'pending'];
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{String(t.name)}</TableCell>
                  <TableCell className="text-muted-foreground">{String(t.identifier)}</TableCell>
                  <TableCell className="text-muted-foreground">v{String(t.version)}</TableCell>
                  <TableCell>
                    <Badge variant={s.variant}>{s.text}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </PocLayout>
  );
}
