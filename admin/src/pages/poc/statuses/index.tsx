import { Button } from '@components/ui/button';
import { PocLayout } from '@poc/poc-layout';
import { mockStatuses } from '@poc/poc-resources';
import { StatusesTable } from '@poc/statuses-table';
import { Plus } from 'lucide-react';
import NextLink from 'next/link';

export default function PocStatuses() {
  return (
    <PocLayout
      title="Statusar"
      breadcrumb="Resurser"
      actions={
        <Button asChild size="sm">
          <NextLink href="/poc/statuses/new">
            <Plus className="size-4" />
            Skapa status
          </NextLink>
        </Button>
      }
    >
      <StatusesTable data={mockStatuses} />
    </PocLayout>
  );
}
