import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { EditableMetadataList } from '../editable-metadata-list';

const fields = [
  { key: 'name', label: 'Namn', type: 'text' },
  { key: 'displayName', label: 'Visningsnamn', type: 'text' },
];

const listProps = (overrides = {}) => ({
  fields,
  rows: [
    { name: 'NEW', displayName: 'Ny' },
    { name: 'SOLVED', displayName: 'Löst' },
  ],
  onChange: jest.fn(),
  keyField: 'name',
  emptyRow: () => ({ name: '', displayName: '' }),
  itemLabel: 'status',
  addLabel: 'Lägg till status',
  emptyText: 'Inga statusar ännu.',
  ...overrides,
});

describe('EditableMetadataList', () => {
  it('edits, adds and removes rows through onChange', () => {
    const onChange = jest.fn();
    render(React.createElement(EditableMetadataList, listProps({ onChange })));

    fireEvent.change(screen.getByLabelText('Visningsnamn för NEW'), { target: { value: 'Inkommen' } });
    expect(onChange).toHaveBeenLastCalledWith([
      { name: 'NEW', displayName: 'Inkommen' },
      { name: 'SOLVED', displayName: 'Löst' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Ta bort SOLVED' }));
    expect(onChange).toHaveBeenLastCalledWith([{ name: 'NEW', displayName: 'Ny' }]);

    fireEvent.click(screen.getByRole('button', { name: 'Lägg till status' }));
    expect(onChange).toHaveBeenLastCalledWith([
      { name: 'NEW', displayName: 'Ny' },
      { name: 'SOLVED', displayName: 'Löst' },
      { name: '', displayName: '' },
    ]);
  });

  it('locks rows that already exist', () => {
    render(React.createElement(EditableMetadataList, listProps({ lockedKeys: new Set(['NEW']) })));

    expect(screen.getByLabelText('Namn för NEW')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Ta bort NEW' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Namn för SOLVED')).not.toBeDisabled();
  });

  it('shows the row errors it is given and an empty text without rows', () => {
    const { rerender } = render(
      React.createElement(
        EditableMetadataList,
        listProps({ rowErrors: { 1: { name: 'Status "SOLVED" finns redan.' } } })
      )
    );
    expect(screen.getByText('Status "SOLVED" finns redan.')).toBeInTheDocument();

    rerender(React.createElement(EditableMetadataList, listProps({ rows: [] })));
    expect(screen.getByText('Inga statusar ännu.')).toBeInTheDocument();
  });
});
