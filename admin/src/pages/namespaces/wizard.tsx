import { AdminLayout } from '@admin/admin-layout';
import { NamespaceWizard } from '@admin/namespace-wizard/namespace-wizard';
import { Button } from '@components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function NamespaceWizardPage() {
  return (
    <AdminLayout
      title="Nytt namespace"
      breadcrumb="Namespaces"
      actions={
        <Button asChild size="sm" variant="outline">
          <NextLink href="/namespaces">
            <ArrowLeft className="size-4" />
            Till namespaces
          </NextLink>
        </Button>
      }
    >
      <NamespaceWizard />
    </AdminLayout>
  );
}
