import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { LabelColumns } from '../label-columns';
import { LabelDisplayNameDialog } from '../label-display-name-dialog';
import { LabelTree } from '../label-tree';

const label = {
  classification: 'TYPE',
  displayName: 'Hyra',
  resourceName: 'RENT',
  labels: [],
};

describe('label display name UI', () => {
  it('opens display-name editing from the tree with the stable label path', () => {
    const onEdit = jest.fn();
    render(React.createElement(LabelTree, { data: [label], onDisplayNameEdit: onEdit }));

    fireEvent.click(screen.getByRole('button', { name: 'Redigera visningsnamn för Hyra' }));

    expect(onEdit).toHaveBeenCalledWith(label, '0');
  });

  it('opens display-name editing from the column view', () => {
    const onEdit = jest.fn();
    render(React.createElement(LabelColumns, { data: [label], onDisplayNameEdit: onEdit }));

    fireEvent.click(screen.getByRole('button', { name: 'Redigera visningsnamn för Hyra' }));

    expect(onEdit).toHaveBeenCalledWith(label, '0');
  });

  it('prefills, trims and saves a changed display name', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      React.createElement(LabelDisplayNameDialog, {
        target: { label, labelValue: '0' },
        open: true,
        saving: false,
        onOpenChange: jest.fn(),
        onSave,
      })
    );

    expect(screen.getByLabelText('Visningsnamn')).toHaveValue('Hyra');
    expect(screen.getByRole('button', { name: 'Spara' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Visningsnamn'), { target: { value: '  Hyresfrågor  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Hyresfrågor'));
  });
});
