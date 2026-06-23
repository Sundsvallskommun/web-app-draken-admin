import {
  appendLabel,
  defaultClassificationForDepth,
  labelsForSave,
  resourceNameFromDisplayName,
  ROOT_PARENT_VALUE,
} from '../label-editor';

describe('label-editor', () => {
  it('uses the established classification names by level', () => {
    expect(defaultClassificationForDepth(0)).toBe('CATEGORY');
    expect(defaultClassificationForDepth(1)).toBe('TYPE');
    expect(defaultClassificationForDepth(2)).toBe('SUBTYPE');
    expect(defaultClassificationForDepth(3)).toBe('SUBTYPE');
  });

  it('builds API-compatible resource names from display names', () => {
    expect(resourceNameFromDisplayName('Vatten & avlopp')).toBe('VATTEN_AVLOPP');
    expect(resourceNameFromDisplayName('Återställning 2')).toBe('ATERSTALLNING_2');
  });

  it('appends labels at root level or below a selected parent', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        labels: [
          {
            classification: 'TYPE',
            displayName: 'Hyra',
            resourceName: 'HYRA',
            labels: [],
          },
        ],
      },
    ];

    expect(appendLabel(labels, ROOT_PARENT_VALUE, { classification: 'CATEGORY', resourceName: 'OMSORG' })).toHaveLength(
      2
    );

    const next = appendLabel(labels, '0.0', {
      classification: 'SUBTYPE',
      displayName: 'Autogiro',
      resourceName: 'AUTOGIRO',
    });

    expect(next[0].labels?.[0].labels?.[0]).toMatchObject({
      classification: 'SUBTYPE',
      displayName: 'Autogiro',
      resourceName: 'AUTOGIRO',
    });
    expect(labels[0].labels?.[0].labels).toEqual([]);
  });

  it('removes derived list-only state before save', () => {
    const labels = labelsForSave([
      {
        classification: 'CATEGORY',
        resourceName: 'BOENDE',
        isLeaf: false,
        labels: [{ classification: 'TYPE', resourceName: 'HYRA', isLeaf: true }],
      },
    ]);

    expect(labels).toEqual([
      {
        classification: 'CATEGORY',
        resourceName: 'BOENDE',
        labels: [{ classification: 'TYPE', resourceName: 'HYRA', labels: [] }],
      },
    ]);
  });
});
