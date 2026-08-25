import { getResourceConfig } from '../resource-config';
import { prepareResourceRows } from '../use-resource-data';

describe('template list row projection', () => {
  it('derives namespace and template type from their canonical metadata entries', () => {
    const resource = getResourceConfig('templates');
    const rows = prepareResourceRows(resource, [
      {
        identifier: 'decision-template',
        metadata: JSON.stringify([
          { key: 'namespace', value: 'SBK' },
          { key: 'templateType', value: 'Decision' },
        ]),
      },
    ]);

    expect(rows[0]).toMatchObject({
      id: 'decision-template',
      __key: 'decision-template',
      namespace: 'SBK',
      templateType: 'Decision',
    });
  });
});
