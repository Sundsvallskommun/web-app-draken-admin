import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { LabelColumns } from '../label-columns';
import { LabelSettingsDialog } from '../label-settings-dialog';
import { LabelTree } from '../label-tree';

const label = {
  classification: 'TYPE',
  displayName: 'Hyra',
  resourceName: 'RENT',
  attributes: [{ key: 'escalationEmail', value: 'rent@example.com' }],
  labels: [],
};

const dialogProps = (overrides = {}) => ({
  target: { label, labelValue: '0' },
  open: true,
  saving: false,
  canRemove: true,
  onOpenChange: jest.fn(),
  onSave: jest.fn().mockResolvedValue(undefined),
  onDeprecatedChange: jest.fn(),
  onRemove: jest.fn(),
  ...overrides,
});

describe('label settings UI', () => {
  it('offers only copy and settings actions in the tree', () => {
    const onSettings = jest.fn();
    render(React.createElement(LabelTree, { data: [label], onSettings }));

    expect(screen.getByRole('button', { name: 'Kopiera resursnamn RENT' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Redigera visningsnamn/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Avveckla Hyra/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Öppna inställningar för Hyra' }));
    expect(onSettings).toHaveBeenCalledWith(label, '0');
  });

  it('opens settings from the column view with the stable label path', () => {
    const onSettings = jest.fn();
    render(React.createElement(LabelColumns, { data: [label], onSettings }));

    fireEvent.click(screen.getByRole('button', { name: 'Öppna inställningar för Hyra' }));
    expect(onSettings).toHaveBeenCalledWith(label, '0');
  });

  it('edits display name and escalation address in one save', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(React.createElement(LabelSettingsDialog, dialogProps({ onSave })));

    expect(screen.getByLabelText('Visningsnamn')).toHaveValue('Hyra');
    expect(screen.getByLabelText('Eskaleringsadress')).toHaveValue('rent@example.com');
    expect(screen.getByLabelText('Klassificering')).toHaveValue('TYPE');
    expect(screen.getByRole('button', { name: 'Spara' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Visningsnamn'), { target: { value: '  Hyresfrågor  ' } });
    fireEvent.change(screen.getByLabelText('Eskaleringsadress'), {
      target: { value: '  housing@example.com  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        displayName: 'Hyresfrågor',
        escalationEmail: 'housing@example.com',
      })
    );
  });

  it('validates escalation email before saving', async () => {
    const onSave = jest.fn();
    render(React.createElement(LabelSettingsDialog, dialogProps({ onSave })));

    fireEvent.change(screen.getByLabelText('Eskaleringsadress'), { target: { value: 'ogiltig' } });
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }));

    expect(await screen.findByText(/Ange en giltig e-postadress/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('routes lifecycle actions through their confirmation flows', () => {
    const onDeprecatedChange = jest.fn();
    const onRemove = jest.fn();
    render(React.createElement(LabelSettingsDialog, dialogProps({ onDeprecatedChange, onRemove })));

    fireEvent.click(screen.getByRole('button', { name: 'Avveckla etikett' }));
    expect(onDeprecatedChange).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Ta bort permanent' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
