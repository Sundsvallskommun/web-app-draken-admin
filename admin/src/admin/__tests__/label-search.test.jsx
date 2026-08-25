import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { LabelColumns } from '../label-columns';
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

  it('opens the selected search result in the column view', () => {
    const SearchableColumns = () => {
      const [query, setQuery] = React.useState('autogiro');
      return React.createElement(LabelColumns, {
        data: labels,
        query,
        onSearchResultSelect: () => setQuery(''),
      });
    };

    render(React.createElement(SearchableColumns));
    fireEvent.click(screen.getByRole('button', { name: 'Autogiro' }));

    expect(screen.queryByLabelText('Sökresultat för etiketter')).not.toBeInTheDocument();
    const selectedPath = document.querySelectorAll('[aria-current="true"]');
    expect(selectedPath).toHaveLength(3);
    expect(selectedPath[selectedPath.length - 1]).toHaveTextContent('Autogiro');
  });
});
