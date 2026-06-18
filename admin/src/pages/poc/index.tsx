import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { PocLayout } from '@poc/poc-layout';
import { pocResources } from '@poc/poc-resources';
import { ArrowRight } from 'lucide-react';
import NextLink from 'next/link';

export default function PocStart() {
  return (
    <PocLayout title="Välkommen" breadcrumb="Draken Admin">
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Detta är en proof-of-concept av Draken Admin byggd med shadcn/ui (Radix + Tailwind) i stället för
        @sk-web-gui. Alla resurser nedan är migrerade med generisk lista och formulär (mockad data).
      </p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pocResources.map((resource) => {
          const Icon = resource.icon;
          return (
            <li key={resource.name}>
              <NextLink href={`/poc/${resource.name}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-5" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-2">{resource.label}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {resource.readOnly
                      ? 'Skrivskyddad (endast lista).'
                      : resource.canCreate
                        ? 'Stöder skapa, redigera och ta bort.'
                        : 'Endast redigera.'}
                  </CardContent>
                </Card>
              </NextLink>
            </li>
          );
        })}
      </ul>
    </PocLayout>
  );
}
