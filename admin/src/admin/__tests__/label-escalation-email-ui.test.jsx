import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { LabelCreateDialog } from '../label-create-dialog';
import { LabelTree } from '../label-tree';

const category = {
  classification: 'CATEGORY',
  displayName: 'Boende',
  resourceName: 'HOUSING',
  labels: [],
};

describe('label escalation email UI', () => {
  it('shows an existing escalation address and offers label settings', () => {
    const onSettings = jest.fn();
    render(
      React.createElement(LabelTree, {
        data: [
          {
            classification: 'TYPE',
            displayName: 'Hyra',
            resourceName: 'RENT',
            attributes: [{ key: 'escalationEmail', value: 'rent@example.com' }],
          },
        ],
        onSettings,
      })
    );

    expect(screen.getByText('rent@example.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Öppna inställningar för Hyra' }));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it('adds escalationEmail when a TYPE label is created', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    render(
      React.createElement(LabelCreateDialog, {
        data: [category],
        open: true,
        saving: false,
        initialParentValue: '0',
        onOpenChange: jest.fn(),
        onCreate,
      })
    );

    fireEvent.change(screen.getByLabelText('Klassificering *'), { target: { value: 'TYPE' } });
    fireEvent.change(screen.getByLabelText('Namn'), { target: { value: 'Hyra' } });
    fireEvent.change(await screen.findByLabelText('Eskaleringsadress'), {
      target: { value: 'rent@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Skapa' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate.mock.calls[0][0][0].labels[0]).toMatchObject({
      classification: 'TYPE',
      displayName: 'Hyra',
      resourceName: 'HYRA',
      attributes: [{ key: 'escalationEmail', value: 'rent@example.com' }],
    });
  });
});
