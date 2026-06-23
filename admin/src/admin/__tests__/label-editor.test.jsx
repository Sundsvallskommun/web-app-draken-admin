import {
  appendLabel,
  canCreateLabelBelow,
  defaultClassificationForDepth,
  flattenLabelParents,
  labelsForSave,
  removeLabel,
  resourceNameFromDisplayName,
  ROOT_PARENT_VALUE,
  setLabelDeprecated,
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

  it('excludes deprecated branches as possible label parents', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        deprecated: true,
        labels: [
          {
            classification: 'TYPE',
            displayName: 'Hyra',
            resourceName: 'HYRA',
            labels: [],
          },
        ],
      },
      {
        classification: 'CATEGORY',
        displayName: 'Omsorg',
        resourceName: 'OMSORG',
        labels: [],
      },
    ];

    expect(flattenLabelParents(labels)).toEqual([
      { value: ROOT_PARENT_VALUE, label: 'Rotnivå', depth: -1 },
      { value: '1', label: 'Omsorg', depth: 0 },
    ]);
    expect(canCreateLabelBelow(labels, ROOT_PARENT_VALUE)).toBe(true);
    expect(canCreateLabelBelow(labels, '0')).toBe(false);
    expect(canCreateLabelBelow(labels, '0.0')).toBe(false);
    expect(canCreateLabelBelow(labels, '1')).toBe(true);
  });

  it('does not append labels below a deprecated parent', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        deprecated: true,
        labels: [],
      },
    ];

    const next = appendLabel(labels, '0', {
      classification: 'TYPE',
      displayName: 'Hyra',
      resourceName: 'HYRA',
    });

    expect(next).toBe(labels);
    expect(next[0].labels).toEqual([]);
  });

  it('removes derived list-only state before save', () => {
    const labels = labelsForSave([
      {
        id: 'category-id',
        classification: 'CATEGORY',
        resourceName: 'BOENDE',
        resourcePath: 'BOENDE',
        isLeaf: false,
        deprecated: true,
        __key: 'category-id',
        labels: [{ id: 'type-id', classification: 'TYPE', resourceName: 'HYRA', isLeaf: true, deprecated: true }],
      },
    ]);

    expect(labels).toEqual([
      {
        id: 'category-id',
        classification: 'CATEGORY',
        resourceName: 'BOENDE',
        deprecated: true,
        labels: [{ id: 'type-id', classification: 'TYPE', resourceName: 'HYRA', deprecated: true, labels: [] }],
      },
    ]);
  });

  it('sets deprecated recursively for a selected label subtree', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        resourceName: 'BOENDE',
        labels: [
          {
            classification: 'TYPE',
            resourceName: 'HYRA',
            labels: [{ classification: 'SUBTYPE', resourceName: 'AUTOGIRO', labels: [] }],
          },
        ],
      },
      { classification: 'CATEGORY', resourceName: 'OMSORG', labels: [] },
    ];

    const next = setLabelDeprecated(labels, '0.0', true);

    expect(next[0].deprecated).toBeUndefined();
    expect(next[0].labels?.[0].deprecated).toBe(true);
    expect(next[0].labels?.[0].labels?.[0].deprecated).toBe(true);
    expect(next[1]).toBe(labels[1]);
  });

  it('removes the selected label subtree by path', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        resourceName: 'BOENDE',
        labels: [
          { classification: 'TYPE', resourceName: 'HYRA', labels: [] },
          { classification: 'TYPE', resourceName: 'KO', labels: [] },
        ],
      },
    ];

    const next = removeLabel(labels, '0.0');

    expect(next[0].labels).toEqual([{ classification: 'TYPE', resourceName: 'KO', labels: [] }]);
    expect(labels[0].labels).toHaveLength(2);
  });
});
