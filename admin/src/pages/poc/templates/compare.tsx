import { Badge } from '@components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { PocLayout } from '@poc/poc-layout';
import { getPocResource } from '@poc/poc-resources';
import * as React from 'react';

const templates = getPocResource('templates')?.rows ?? [];

// Mocked production content (differs from test for some templates).
const prodOverrides: Record<string, string> = {
  'errand.closed': 'Hej {{name}},\n\nDitt ärende är avslutat.',
};

export default function TemplateCompare() {
  const [selected, setSelected] = React.useState(String(templates[0]?.id ?? ''));
  const tpl = templates.find((t) => t.id === selected);
  const testContent = String(tpl?.content ?? '');
  const prodContent = prodOverrides[selected] ?? testContent;
  const differs = testContent !== prodContent;

  return (
    <PocLayout title="Jämför miljöer" breadcrumb="Mallar">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-[22rem]" aria-label="Välj mall">
              <SelectValue placeholder="Välj mall" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {String(t.name)} ({String(t.identifier)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {differs ? (
            <Badge variant="destructive">Skiljer sig mellan miljöer</Badge>
          ) : (
            <Badge>Identiska</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            { env: 'Test', content: testContent },
            { env: 'Produktion', content: prodContent },
          ].map(({ env, content }) => (
            <Card key={env}>
              <CardHeader>
                <CardTitle className="text-base">{env}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-md bg-muted p-4 font-mono text-sm">{content}</pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PocLayout>
  );
}
