import { Button } from '@components/ui/button';
import { PocLayout } from '@poc/poc-layout';
import { ResourceForm } from '@poc/resource-form';
import { usePocRows } from '@poc/use-poc-rows';
import { ArrowLeft } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

// SSR so router.query (resource + id segments) is populated on first paint.
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function PocResourceEdit() {
  const router = useRouter();
  const resourceName = Array.isArray(router.query.resource) ? router.query.resource[0] : router.query.resource;
  const idSegments = router.query.id;
  // Composite ids (e.g. "CONTACTCENTER/ONGOING") arrive as multiple segments.
  const rawId = Array.isArray(idSegments) ? idSegments.join('/') : idSegments;
  const isNew = rawId === 'new';

  // Fetches via the real service layer (mock fallback when not logged in).
  const { rows, loading, resource } = usePocRows(resourceName);

  if (!router.isReady) {
    return (
      <PocLayout title="Laddar…" breadcrumb="Resurser">
        {null}
      </PocLayout>
    );
  }

  if (!resource) {
    return (
      <PocLayout title="Okänd resurs" breadcrumb="Resurser">
        <p className="text-muted-foreground">Den här resursen finns inte i PoC:n.</p>
      </PocLayout>
    );
  }

  const initial = !isNew ? rows.find((r) => r.id === rawId) : undefined;
  const firstKey = resource.fields[0].key;
  const title = isNew
    ? `Skapa ${resource.label.toLowerCase()}`
    : String(initial?.[firstKey] ?? rawId ?? `Redigera ${resource.label.toLowerCase()}`);

  return (
    <PocLayout
      title={title}
      breadcrumb={resource.label}
      actions={
        <Button asChild variant="ghost" size="sm">
          <NextLink href={`/${resource.name}`}>
            <ArrowLeft className="size-4" />
            Tillbaka
          </NextLink>
        </Button>
      }
    >
      {!isNew && loading ? (
        <p className="text-muted-foreground">Hämtar…</p>
      ) : !isNew && !initial ? (
        <p className="text-muted-foreground">Hittade ingen post med id {rawId}.</p>
      ) : (
        <ResourceForm resource={resource} initial={initial} isNew={isNew} />
      )}
    </PocLayout>
  );
}
