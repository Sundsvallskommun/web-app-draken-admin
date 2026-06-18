import { Button } from '@components/ui/button';
import { PocLayout } from '@poc/poc-layout';
import { mockStatuses } from '@poc/poc-resources';
import { StatusForm } from '@poc/status-form';
import { ArrowLeft } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export default function PocStatusEdit() {
  const router = useRouter();
  const { id } = router.query;
  const rawId = Array.isArray(id) ? id[0] : id;
  const isNew = rawId === 'new';

  // Dynamic routes without a data method have an empty query during prerender;
  // wait until the client router is ready before resolving the record.
  if (!router.isReady) {
    return <PocLayout title="Laddar…" breadcrumb="Statusar">{null}</PocLayout>;
  }

  // Composite key from the table: `${namespace}__${name}`
  const initial = !isNew && rawId ? mockStatuses.find((s) => `${s.namespace}__${s.id}` === rawId) : undefined;

  const title = isNew ? 'Skapa status' : (initial?.displayName ?? initial?.name ?? 'Redigera status');

  return (
    <PocLayout
      title={title}
      breadcrumb="Statusar"
      actions={
        <Button asChild variant="ghost" size="sm">
          <NextLink href="/poc/statuses">
            <ArrowLeft className="size-4" />
            Tillbaka
          </NextLink>
        </Button>
      }
    >
      {!isNew && !initial ? (
        <p className="text-muted-foreground">Hittade ingen status med id {rawId}.</p>
      ) : (
        <StatusForm initial={initial} isNew={isNew} />
      )}
    </PocLayout>
  );
}
