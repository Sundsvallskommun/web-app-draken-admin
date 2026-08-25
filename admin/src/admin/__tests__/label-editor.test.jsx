import {
  appendLabel,
  canCreateLabelBelow,
  defaultClassificationForParent,
  flattenLabelParents,
  labelsForSave,
  rehydrateLabelPath,
  removeLabel,
  resourceNameFromDisplayName,
  ROOT_PARENT_VALUE,
  setLabelDeprecated,
  setLabelDisplayName,
  setLabelEscalationEmail,
} from '../label-editor';

describe('label-editor', () => {
  it('only defaults to SUBTYPE below a TYPE parent', () => {
    expect(defaultClassificationForParent({ value: ROOT_PARENT_VALUE, label: 'Rotnivå' })).toBe('');
    expect(defaultClassificationForParent({ value: '0', label: 'Kategori', classification: 'CATEGORY' })).toBe('');
    expect(defaultClassificationForParent({ value: '0.0', label: 'Typ', classification: 'TYPE' })).toBe('SUBTYPE');
    expect(defaultClassificationForParent({ value: '0.0', label: 'Typ', classification: 'type' })).toBe('SUBTYPE');
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
      { value: ROOT_PARENT_VALUE, label: 'Rotnivå' },
      { value: '1', label: 'Omsorg', classification: 'CATEGORY' },
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

  it('rehydrates the selected label path after refetching labels', () => {
    const labels = [
      {
        id: 'root-id',
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        labels: [
          {
            id: 'type-id',
            classification: 'TYPE',
            displayName: 'Hyra',
            resourceName: 'HYRA',
            labels: [],
          },
        ],
      },
    ];
    const currentPath = [
      { node: labels[0], pathValue: '0' },
      { node: labels[0].labels[0], pathValue: '0.0' },
    ];
    const refreshedLabels = [
      {
        id: 'other-root-id',
        classification: 'CATEGORY',
        displayName: 'Omsorg',
        resourceName: 'OMSORG',
        labels: [],
      },
      {
        id: 'root-id',
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        deprecated: true,
        labels: [
          {
            id: 'type-id',
            classification: 'TYPE',
            displayName: 'Hyra',
            resourceName: 'HYRA',
            deprecated: true,
            labels: [],
          },
        ],
      },
    ];

    const nextPath = rehydrateLabelPath(refreshedLabels, currentPath);

    expect(nextPath.map((entry) => entry.pathValue)).toEqual(['1', '1.0']);
    expect(nextPath[0].node).toBe(refreshedLabels[1]);
    expect(nextPath[0].node.deprecated).toBe(true);
    expect(nextPath[1].node).toBe(refreshedLabels[1].labels[0]);
    expect(nextPath[1].node.deprecated).toBe(true);
  });

  it('removes derived list-only state before save', () => {
    const labels = labelsForSave([
      {
        id: 'category-id',
        classification: 'CATEGORY',
        displayName: 'Boende',
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
        displayName: 'Boende',
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

  it('updates escalationEmail on the selected label without changing sibling metadata', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        resourceName: 'HOUSING',
        attributes: [{ key: 'owner', value: 'housing' }],
        labels: [
          {
            classification: 'TYPE',
            resourceName: 'RENT',
            attributes: [{ key: 'owner', value: 'service-center' }],
            labels: [],
          },
          { classification: 'TYPE', resourceName: 'QUEUE', labels: [] },
        ],
      },
    ];

    const added = setLabelEscalationEmail(labels, '0.0', 'rent@example.com');

    expect(added[0].attributes).toEqual([{ key: 'owner', value: 'housing' }]);
    expect(added[0].labels[0].attributes).toEqual([
      { key: 'owner', value: 'service-center' },
      { key: 'escalationEmail', value: 'rent@example.com' },
    ]);
    expect(added[0].labels[1]).toBe(labels[0].labels[1]);
    expect(labels[0].labels[0].attributes).toEqual([{ key: 'owner', value: 'service-center' }]);

    const removed = setLabelEscalationEmail(added, '0.0', '');
    expect(removed[0].labels[0].attributes).toEqual([{ key: 'owner', value: 'service-center' }]);
  });

  it('updates only the selected display name and preserves its stable resource name', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'HOUSING',
        labels: [
          {
            classification: 'TYPE',
            displayName: 'Hyra',
            resourceName: 'RENT',
            attributes: [{ key: 'owner', value: 'service-center' }],
            labels: [],
          },
          { classification: 'TYPE', displayName: 'Kö', resourceName: 'QUEUE', labels: [] },
        ],
      },
    ];

    const next = setLabelDisplayName(labels, '0.0', '  Hyresfrågor  ');

    expect(next[0].labels[0]).toEqual({
      classification: 'TYPE',
      displayName: 'Hyresfrågor',
      resourceName: 'RENT',
      attributes: [{ key: 'owner', value: 'service-center' }],
      labels: [],
    });
    expect(next[0].labels[1]).toBe(labels[0].labels[1]);
    expect(labels[0].labels[0].displayName).toBe('Hyra');
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
