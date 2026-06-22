import { Button } from '@components/ui/button';
import { AdminLayout } from '@admin/admin-layout';
import { ResourceForm } from '@admin/resource-form';
import { useResourceRecord } from '@admin/use-resource-data';
import { ArrowLeft } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

// SSR so router.query (resource + id segments) is populated on first paint.
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function ResourceEditPage() {
  const router = useRouter();
  const resourceName = Array.isArray(router.query.resource) ? router.query.resource[0] : router.query.resource;
  const idSegments = router.query.id;
  // Composite ids (e.g. "CONTACTCENTER/ONGOING") arrive as multiple segments.
  const rawId = Array.isArray(idSegments) ? idSegments.join('/') : idSegments;
  const isNew = rawId === 'new';

  const { row: initial, loading, resource } = useResourceRecord(resourceName, rawId);

  if (!router.isReady) {
    return (
      <AdminLayout title="Laddar…" breadcrumb="Resurser">
        {null}
      </AdminLayout>
    );
  }

  if (!resource) {
    return (
      <AdminLayout title="Okänd resurs" breadcrumb="Resurser">
        <p className="text-muted-foreground">Den här resursen finns inte.</p>
      </AdminLayout>
    );
  }

  const firstKey = resource.fields[0].key;
  const title = isNew
    ? `Skapa ${resource.label.toLowerCase()}`
    : String(initial?.[firstKey] ?? rawId ?? `Redigera ${resource.label.toLowerCase()}`);

  return (
    <AdminLayout
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
    </AdminLayout>
  );
}
