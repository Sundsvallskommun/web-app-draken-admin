import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { TemplateForm } from '../template-form';

const mockCreateRow = jest.fn();
const mockUpdateRow = jest.fn();
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('../use-resource-data', () => ({
  createRow: (...args) => mockCreateRow(...args),
  updateRow: (...args) => mockUpdateRow(...args),
}));
jest.mock('../use-namespaces', () => ({ useNamespaces: () => [] }));
jest.mock('@utils/use-is-production-env.hook', () => ({
  useIsProductionEnv: () => ({ showTestFeatures: false }),
}));
jest.mock('@utils/use-localstorage.hook', () => ({
  useLocalStorage: (selector) => selector({ municipalityId: 2281 }),
}));
jest.mock('@admin/monaco-field', () => ({
  MonacoField: ({ value, onChange, disabled }) =>
    require('react').createElement('textarea', {
      value,
      onChange: (event) => onChange(event.target.value),
      disabled,
    }),
}));
jest.mock('next/dynamic', () => () => () => null);
jest.mock('next/router', () => ({ useRouter: () => mockRouter }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

describe('template form navigation after save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateRow.mockResolvedValue({});
    mockUpdateRow.mockResolvedValue({});
    mockRouter.push.mockResolvedValue(true);
    mockRouter.replace.mockResolvedValue(true);
  });

  it('stays on the editor after an existing template is saved', async () => {
    render(
      React.createElement(TemplateForm, {
        initial: {
          id: 'decision-template',
          identifier: 'decision-template',
          name: 'Beslut',
          content: 'Innehåll',
          metadata: '[]',
          defaultValues: '[]',
        },
        isNew: false,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Spara ändringar' }));

    await waitFor(() => expect(mockUpdateRow).toHaveBeenCalledTimes(1));
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('opens the created template in the editor instead of returning to the table', async () => {
    render(React.createElement(TemplateForm, { isNew: true }));

    fireEvent.change(screen.getByPlaceholderText('t.ex. decision.letter'), {
      target: { value: 'new.template' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Skapa mall' }));

    await waitFor(() => expect(mockCreateRow).toHaveBeenCalledTimes(1));
    expect(mockRouter.replace).toHaveBeenCalledWith('/templates/new.template');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
