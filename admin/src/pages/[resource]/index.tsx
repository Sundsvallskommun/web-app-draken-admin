import { Button } from '@components/ui/button';
import { PocLayout } from '@poc/poc-layout';
import { getPocResource } from '@poc/poc-resources';
import { ResourceTable } from '@poc/resource-table';
import { Plus } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

// Enables SSR so router.query (the [resource] param) is populated on first
// paint — avoids the "Laddar…" flash on direct loads.
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function PocResourceList() {
  const router = useRouter();
  const resource = getPocResource(Array.isArray(router.query.resource) ? router.query.resource[0] : router.query.resource);

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

  return (
    <PocLayout
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
        <p className="mb-4 text-sm text-muted-foreground">Den här resursen är skrivskyddad i PoC:n (endast lista).</p>
      )}
      <ResourceTable resource={resource} />
    </PocLayout>
  );
}
