import { findLabelMatches, visibleLabelEntries } from '../label-utils';

const labels = [
  {
    id: 'unrelated-root',
    classification: 'CATEGORY',
    displayName: 'Omsorg',
    resourceName: 'OMSORG',
    labels: [],
  },
  {
    id: 'matching-root',
    classification: 'CATEGORY',
    displayName: 'Boende',
    resourceName: 'BOENDE',
    labels: [
      {
        id: 'matching-type',
        classification: 'TYPE',
        displayName: 'Hyra',
        resourceName: 'HYRA',
        labels: [
          {
            id: 'matching-subtype',
            classification: 'SUBTYPE',
            displayName: 'Autogiro',
            resourceName: 'AUTOGIRO',
            labels: [],
          },
          {
            id: 'unrelated-subtype',
            classification: 'SUBTYPE',
            displayName: 'Uppsägning',
            resourceName: 'UPPSAGNING',
            labels: [],
          },
        ],
      },
    ],
  },
];

describe('label search', () => {
  it('finds direct matches with their original tree path and breadcrumb', () => {
    expect(findLabelMatches(labels, 'autogiro')).toEqual([
      expect.objectContaining({
        node: labels[1].labels[0].labels[0],
        pathValue: '1.0.0',
        breadcrumb: 'Boende / Hyra / Autogiro',
      }),
    ]);
  });

  it('filters every tree level while preserving the original action indexes', () => {
    const roots = visibleLabelEntries(labels, 'autogiro');
    const types = visibleLabelEntries(roots[0].node.labels, 'autogiro');
    const subtypes = visibleLabelEntries(types[0].node.labels, 'autogiro');

    expect(roots).toEqual([{ node: labels[1], index: 1 }]);
    expect(types).toEqual([{ node: labels[1].labels[0], index: 0 }]);
    expect(subtypes).toEqual([{ node: labels[1].labels[0].labels[0], index: 0 }]);
  });
});
