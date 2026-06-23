import {
  appendLabel,
  buildLabelMovePreview,
  defaultClassificationForDepth,
  flattenLabelSubtree,
  labelsForSave,
  moveLabelBackward,
  rehydrateLabelPath,
  removeLabel,
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
        id: 'category-id',
        classification: 'CATEGORY',
        resourceName: 'BOENDE',
        resourcePath: 'CATEGORY.BOENDE',
        isLeaf: false,
        __key: 'category-id',
        labels: [
          {
            id: 'type-id',
            classification: 'TYPE',
            resourceName: 'HYRA',
            resourcePath: 'CATEGORY.BOENDE.TYPE.HYRA',
            isLeaf: true,
            labels: [],
          },
        ],
      },
    ]);

    expect(labels).toEqual([
      {
        id: 'category-id',
        classification: 'CATEGORY',
        resourceName: 'BOENDE',
        labels: [{ id: 'type-id', classification: 'TYPE', resourceName: 'HYRA' }],
      },
    ]);
  });

  it('removes the selected label subtree by path', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        labels: [
          { classification: 'TYPE', displayName: 'Hyra', resourceName: 'HYRA', labels: [] },
          { classification: 'TYPE', displayName: 'Kö', resourceName: 'KO', labels: [] },
        ],
      },
      {
        classification: 'CATEGORY',
        displayName: 'Omsorg',
        resourceName: 'OMSORG',
        labels: [],
      },
    ];

    const next = removeLabel(labels, '0.0');

    expect(next[0].labels).toEqual([{ classification: 'TYPE', displayName: 'Kö', resourceName: 'KO', labels: [] }]);
    expect(next[1]).toBe(labels[1]);
    expect(labels[0].labels).toHaveLength(2);
  });

  it('flattens a selected subtree with stable label keys', () => {
    const label = {
      id: 'category-id',
      classification: 'CATEGORY',
      displayName: 'Boende',
      resourceName: 'BOENDE',
      labels: [
        {
          id: 'type-id',
          classification: 'TYPE',
          displayName: 'Hyra',
          resourceName: 'HYRA',
          labels: [{ classification: 'SUBTYPE', displayName: 'Autogiro', resourceName: 'AUTOGIRO' }],
        },
      ],
    };

    expect(flattenLabelSubtree(label)).toEqual([
      { node: label, depth: 0, key: 'id:category-id' },
      { node: label.labels[0], depth: 1, key: 'id:type-id' },
      { node: label.labels[0].labels[0], depth: 2, key: 'resource:AUTOGIRO\u0000Autogiro' },
    ]);
  });

  it('moves labels only to a shallower level and updates classification', () => {
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
            labels: [
              {
                classification: 'SUBTYPE',
                displayName: 'Autogiro',
                resourceName: 'AUTOGIRO',
                labels: [{ classification: 'SUBTYPE', displayName: 'Misslyckad', resourceName: 'MISSLYCKAD' }],
              },
            ],
          },
        ],
      },
    ];

    const next = moveLabelBackward(labels, {
      sourceValue: '0.0.0',
      targetParentValue: '0',
      classification: 'TYPE',
    });

    expect(next[0].labels).toHaveLength(2);
    expect(next[0].labels?.[0].labels).toEqual([]);
    expect(next[0].labels?.[1]).toMatchObject({
      classification: 'TYPE',
      displayName: 'Autogiro',
      resourceName: 'AUTOGIRO',
      labels: [{ classification: 'SUBTYPE', displayName: 'Misslyckad', resourceName: 'MISSLYCKAD' }],
    });
    expect(labels[0].labels?.[0].labels).toHaveLength(1);
  });

  it('moves labels backward under a different root branch', () => {
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
            labels: [
              { id: 'subtype-id', classification: 'SUBTYPE', displayName: 'Autogiro', resourceName: 'AUTOGIRO' },
            ],
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

    const next = moveLabelBackward(labels, {
      sourceValue: '0.0.0',
      targetParentValue: '1',
      classification: 'TYPE',
    });

    expect(next[0].labels?.[0].labels).toEqual([]);
    expect(next[1].labels?.[0]).toMatchObject({
      id: 'subtype-id',
      classification: 'TYPE',
      displayName: 'Autogiro',
      resourceName: 'AUTOGIRO',
    });
  });

  it('moves labels sideways to the same level under another branch', () => {
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
            labels: [
              { id: 'subtype-id', classification: 'SUBTYPE', displayName: 'Autogiro', resourceName: 'AUTOGIRO' },
            ],
          },
        ],
      },
      {
        classification: 'CATEGORY',
        displayName: 'Omsorg',
        resourceName: 'OMSORG',
        labels: [
          {
            classification: 'TYPE',
            displayName: 'Avgift',
            resourceName: 'AVGIFT',
            labels: [],
          },
        ],
      },
    ];

    const next = moveLabelBackward(labels, {
      sourceValue: '0.0.0',
      targetParentValue: '1.0',
      classification: 'SUBTYPE',
    });

    expect(next[0].labels?.[0].labels).toEqual([]);
    expect(next[1].labels?.[0].labels?.[0]).toMatchObject({
      id: 'subtype-id',
      classification: 'SUBTYPE',
      displayName: 'Autogiro',
      resourceName: 'AUTOGIRO',
    });
  });

  it('builds a before and after preview for a valid move', () => {
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
            labels: [
              { id: 'subtype-id', classification: 'SUBTYPE', displayName: 'Autogiro', resourceName: 'AUTOGIRO' },
            ],
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

    const result = buildLabelMovePreview(labels, {
      sourceValue: '0.0.0',
      targetParentValue: '1',
      classification: 'TYPE',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.preview.before).toBe(labels);
    expect(result.preview.after).not.toBe(labels);
    expect(result.preview.movedLabelKey).toBe('id:subtype-id');
    expect(result.preview.movedLabelKeys).toEqual(['id:subtype-id']);
    expect(result.preview.targetParent).toBe(labels[1]);
    expect(result.preview.targetLevel).toBe(1);
    expect(result.preview.after[1].labels?.[0].classification).toBe('TYPE');
  });

  it('includes the full moved subtree in preview highlight keys', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        labels: [
          {
            id: 'type-id',
            classification: 'TYPE',
            displayName: 'Hyra',
            resourceName: 'HYRA',
            labels: [
              { id: 'subtype-id', classification: 'SUBTYPE', displayName: 'Autogiro', resourceName: 'AUTOGIRO' },
            ],
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

    const result = buildLabelMovePreview(labels, {
      sourceValue: '0.0',
      targetParentValue: '1',
      classification: 'TYPE',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.preview.movedLabelKeys).toEqual(['id:type-id', 'id:subtype-id']);
  });

  it('rejects moves to root because the API does not preserve existing label ids there', () => {
    const labels = [
      {
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        labels: [{ classification: 'TYPE', displayName: 'Hyra', resourceName: 'HYRA', labels: [] }],
      },
    ];

    expect(
      moveLabelBackward(labels, {
        sourceValue: '0.0',
        targetParentValue: ROOT_PARENT_VALUE,
        classification: 'CATEGORY',
      })
    ).toBe(labels);
    expect(
      buildLabelMovePreview(labels, {
        sourceValue: '0.0',
        targetParentValue: ROOT_PARENT_VALUE,
        classification: 'CATEGORY',
      })
    ).toEqual({ ok: false, reason: 'root-target-unsupported' });
  });

  it('rejects moves to the current parent or a deeper level', () => {
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
    ];

    expect(
      moveLabelBackward(labels, {
        sourceValue: '0.0.0',
        targetParentValue: '0.0',
        classification: 'SUBTYPE',
      })
    ).toBe(labels);
    expect(
      buildLabelMovePreview(labels, {
        sourceValue: '0.0.0',
        targetParentValue: '0.0',
        classification: 'SUBTYPE',
      })
    ).toEqual({ ok: false, reason: 'same-parent' });
    expect(
      moveLabelBackward(labels, {
        sourceValue: '0',
        targetParentValue: '0.0',
        classification: 'SUBTYPE',
      })
    ).toBe(labels);
    expect(
      buildLabelMovePreview(labels, {
        sourceValue: '0',
        targetParentValue: '0.0',
        classification: 'SUBTYPE',
      })
    ).toEqual({ ok: false, reason: 'deeper-level' });
  });

  it('rehydrates selected column path after a data refresh', () => {
    const previousCategory = {
      classification: 'CATEGORY',
      displayName: 'Boende',
      resourceName: 'BOENDE',
      labels: [{ classification: 'TYPE', displayName: 'Hyra', resourceName: 'HYRA', labels: [] }],
    };
    const refreshed = [
      {
        classification: 'CATEGORY',
        displayName: 'Boende',
        resourceName: 'BOENDE',
        labels: [
          { classification: 'TYPE', displayName: 'Hyra', resourceName: 'HYRA', labels: [] },
          { classification: 'TYPE', displayName: 'Kö', resourceName: 'KO', labels: [] },
        ],
      },
    ];

    const path = rehydrateLabelPath(refreshed, [
      { node: previousCategory, pathValue: '0' },
      { node: previousCategory.labels[0], pathValue: '0.0' },
    ]);

    expect(path).toEqual([
      { node: refreshed[0], pathValue: '0' },
      { node: refreshed[0].labels[0], pathValue: '0.0' },
    ]);
  });

  it('keeps the nearest valid column ancestor when selected child moved away', () => {
    const previousCategory = {
      classification: 'CATEGORY',
      displayName: 'Boende',
      resourceName: 'BOENDE',
      labels: [{ classification: 'TYPE', displayName: 'Hyra', resourceName: 'HYRA', labels: [] }],
    };
    const refreshed = [
      { classification: 'CATEGORY', displayName: 'Boende', resourceName: 'BOENDE', labels: [] },
      { classification: 'TYPE', displayName: 'Hyra', resourceName: 'HYRA', labels: [] },
    ];

    const path = rehydrateLabelPath(refreshed, [
      { node: previousCategory, pathValue: '0' },
      { node: previousCategory.labels[0], pathValue: '0.0' },
    ]);

    expect(path).toEqual([{ node: refreshed[0], pathValue: '0' }]);
  });
});
