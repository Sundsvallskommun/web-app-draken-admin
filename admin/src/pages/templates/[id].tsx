import { Button } from '@components/ui/button';
import { AdminLayout } from '@admin/admin-layout';
import { TemplateForm } from '@admin/template-form';
import { useResourceRecord } from '@admin/use-resource-data';
import { ArrowLeft } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function TemplateEditPage() {
  const router = useRouter();
  const rawId = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
  const isNew = rawId === 'new';
  // Fetch the full template via getOne — the list response omits `content`.
  const { row: initial, loading } = useResourceRecord('templates', rawId);

  if (!router.isReady) {
    return (
      <AdminLayout title="Laddar…" breadcrumb="Mallar">
        {null}
      </AdminLayout>
    );
  }

  const title = isNew ? 'Skapa mall' : String(initial?.name ?? initial?.identifier ?? rawId ?? 'Redigera mall');

  return (
    <AdminLayout
      title={title}
      breadcrumb="Mallar"
      actions={
        <Button asChild variant="ghost" size="sm">
          <NextLink href="/templates">
            <ArrowLeft className="size-4" />
            Tillbaka
          </NextLink>
        </Button>
      }
    >
      {!isNew && loading ? (
        <p className="text-muted-foreground">Hämtar…</p>
      ) : !isNew && !initial ? (
        <p className="text-muted-foreground">Hittade ingen mall med id {rawId}.</p>
      ) : (
        <TemplateForm initial={initial} isNew={isNew} />
      )}
    </AdminLayout>
  );
}
