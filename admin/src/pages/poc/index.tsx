import { Badge } from '@components/ui/badge';
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
        @sk-web-gui. Endast resursen <strong className="text-foreground">Statusar</strong> är fullt
        implementerad nedan.
      </p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pocResources.map((resource) => {
          const Icon = resource.icon;
          const implemented = resource.name === 'statuses';
          const card = (
            <Card className={implemented ? 'h-full transition-colors hover:border-primary' : 'h-full opacity-70'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>
                  {implemented ? (
                    <ArrowRight className="size-4 text-muted-foreground" />
                  ) : (
                    <Badge variant="outline">Snart</Badge>
                  )}
                </div>
                <CardTitle className="mt-2">{resource.label}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {resource.canCreate ? 'Stöder skapa, redigera och ta bort.' : 'Endast läs/redigera.'}
              </CardContent>
            </Card>
          );
          return (
            <li key={resource.name}>
              {implemented ? <NextLink href="/poc/statuses">{card}</NextLink> : card}
            </li>
          );
        })}
      </ul>
    </PocLayout>
  );
}
