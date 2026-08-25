import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { getResourceConfig } from '../resource-config';
import { ResourceTable } from '../resource-table';

const mockUseResourceRows = jest.fn();
const mockSetSelectedNamespace = jest.fn();

jest.mock('../use-resource-data', () => ({
  removeRow: jest.fn(),
  useResourceRows: (...args) => mockUseResourceRows(...args),
}));
jest.mock('../use-namespaces', () => ({
  useNamespaces: () => [
    { value: 'SBK', label: 'Stadsbyggnad (SBK)' },
    { value: 'SOC', label: 'Socialtjänst (SOC)' },
  ],
}));
jest.mock('@utils/use-localstorage.hook', () => ({
  useLocalStorage: (selector) =>
    selector({ municipalityId: 2281, selectedNamespace: '', setSelectedNamespace: mockSetSelectedNamespace }),
}));

const rows = [
  {
    id: 'decision-template',
    __key: 'decision-template',
    identifier: 'decision-template',
    name: 'Beslut',
    description: 'Beslutsmall',
    templateType: 'Decision',
    version: '1.0',
  },
  {
    id: 'email-template',
    __key: 'email-template',
    identifier: 'email-template',
    name: 'E-post',
    description: 'E-postmall',
    templateType: 'Email',
    version: '2.0',
  },
];

describe('template list filters', () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture = jest.fn(() => false);
    Element.prototype.setPointerCapture = jest.fn();
    Element.prototype.releasePointerCapture = jest.fn();
    Element.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    mockUseResourceRows.mockImplementation(() => ({
      rows,
      loading: false,
      error: null,
      refresh: jest.fn(),
    }));
  });

  it('offers namespace and template-type filters and filters exact template types', async () => {
    const resource = getResourceConfig('templates');
    render(React.createElement(ResourceTable, { resource }));

    expect(screen.getByRole('combobox', { name: 'Filtrera på namespace' })).toBeInTheDocument();
    const typeFilter = screen.getByRole('combobox', { name: 'Filtrera på malltyp' });
    expect(typeFilter).toBeInTheDocument();

    fireEvent.click(typeFilter);
    fireEvent.click(await screen.findByRole('option', { name: 'Decision' }));

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getByText('decision-template')).toBeInTheDocument();
      expect(within(table).queryByText('email-template')).not.toBeInTheDocument();
    });
  });

  it('passes a selected namespace to the template endpoint', async () => {
    const resource = getResourceConfig('templates');
    render(React.createElement(ResourceTable, { resource }));

    fireEvent.click(screen.getByRole('combobox', { name: 'Filtrera på namespace' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Stadsbyggnad (SBK)' }));

    await waitFor(() => expect(mockUseResourceRows).toHaveBeenLastCalledWith('templates', 'SBK'));
    expect(mockSetSelectedNamespace).toHaveBeenCalledWith('SBK');
  });
});
