import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { LabelWorkspace } from '../label-workspace';

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

const category = { classification: 'CATEGORY', displayName: 'Boende', resourceName: 'HOUSING', labels: [] };

const workspaceProps = (overrides = {}) => ({
  labels: [category],
  onLabelsChange: jest.fn().mockResolvedValue(true),
  canRemove: true,
  ...overrides,
});

describe('LabelWorkspace', () => {
  beforeAll(() => {
    // Radix Select relies on these in jsdom.
    window.HTMLElement.prototype.hasPointerCapture = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('shows an empty state instead of "no matches" when there are no labels', () => {
    render(React.createElement(LabelWorkspace, workspaceProps({ labels: [] })));

    expect(screen.getByText('Inga etiketter ännu.')).toBeInTheDocument();
    expect(screen.queryByText('Inga etiketter matchade.')).not.toBeInTheDocument();
  });

  it('passes the edited tree to onLabelsChange and closes the dialog once it is applied', async () => {
    const onLabelsChange = jest.fn().mockResolvedValue(true);
    render(React.createElement(LabelWorkspace, workspaceProps({ onLabelsChange })));

    fireEvent.click(screen.getByRole('button', { name: 'Öppna inställningar för Boende' }));
    fireEvent.change(screen.getByLabelText('Visningsnamn'), { target: { value: 'Bostad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }));

    await waitFor(() =>
      expect(onLabelsChange).toHaveBeenCalledWith([expect.objectContaining({ ...category, displayName: 'Bostad' })], {
        kind: 'settings',
      })
    );
    await waitFor(() => expect(screen.queryByLabelText('Visningsnamn')).not.toBeInTheDocument());
  });

  it('keeps the dialog open when the change was not applied', async () => {
    const onLabelsChange = jest.fn().mockResolvedValue(false);
    render(React.createElement(LabelWorkspace, workspaceProps({ onLabelsChange })));

    fireEvent.click(screen.getByRole('button', { name: 'Öppna inställningar för Boende' }));
    fireEvent.change(screen.getByLabelText('Visningsnamn'), { target: { value: 'Bostad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }));

    await waitFor(() => expect(onLabelsChange).toHaveBeenCalled());
    expect(screen.getByLabelText('Visningsnamn')).toBeInTheDocument();
  });

  it('hides the deprecate action when canDeprecate is false', () => {
    render(React.createElement(LabelWorkspace, workspaceProps({ canDeprecate: false })));

    fireEvent.click(screen.getByRole('button', { name: 'Öppna inställningar för Boende' }));

    expect(screen.queryByRole('button', { name: 'Avveckla etikett' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ta bort permanent' })).toBeInTheDocument();
  });
});
