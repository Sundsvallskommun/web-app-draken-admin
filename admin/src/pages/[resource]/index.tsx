import { Button } from '@components/ui/button';
import { AdminLayout } from '@admin/admin-layout';
import { getResourceConfig } from '@admin/resource-config';
import { ResourceTable } from '@admin/resource-table';
import { Plus } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

// Enables SSR so router.query (the [resource] param) is populated on first
// paint — avoids the "Laddar…" flash on direct loads.
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function ResourceListPage() {
  const router = useRouter();
  const resource = getResourceConfig(Array.isArray(router.query.resource) ? router.query.resource[0] : router.query.resource);

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

  return (
    <AdminLayout
      title={resource.label}
      breadcrumb="Resurser"
      actions={
        resource.canCreate ? (
          <Button asChild size="sm">
            <NextLink href={`/${resource.name}/new`}>
              <Plus className="size-4" />
              Skapa
            </NextLink>
          </Button>
        ) : null
      }
    >
      {resource.readOnly && (
        <p className="mb-4 text-sm text-muted-foreground">Den här resursen är skrivskyddad (endast lista).</p>
      )}
      <ResourceTable resource={resource} />
    </AdminLayout>
  );
}
