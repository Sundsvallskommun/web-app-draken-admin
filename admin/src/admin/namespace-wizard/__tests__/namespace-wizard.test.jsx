import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { NamespaceWizard } from '../namespace-wizard';

const mockApi = {
  listNamespaces: jest.fn(),
  createNamespace: jest.fn(),
  listMetadataKeys: jest.fn(),
  createMetadata: jest.fn(),
  getLabels: jest.fn(),
  saveLabels: jest.fn(),
  hasEmailIntegration: jest.fn(),
  createEmailIntegration: jest.fn(),
  updateEmailIntegration: jest.fn(),
};

// A getter, since the mock factory runs before mockApi is initialised.
jest.mock('../namespace-submission-api', () => ({
  get namespaceSubmissionApi() {
    return mockApi;
  },
}));
jest.mock('@admin/use-resource-data', () => ({
  ...jest.requireActual('@admin/use-resource-data'),
  useResourceRows: () => ({
    rows: [{ id: 'TAKEN', namespace: 'TAKEN', displayName: 'Upptagen', shortCode: 'TK' }],
    loading: false,
  }),
}));
jest.mock('@admin/use-namespaces', () => ({
  useNamespaces: () => [{ value: 'SBK_MEX', label: 'SBK_MEX' }],
}));
jest.mock('@utils/use-localstorage.hook', () => ({
  useLocalStorage: (selector) => selector({ municipalityId: 2281 }),
}));
jest.mock('@utils/use-is-production-env.hook', () => ({
  useAdminEnvironment: () => ({ isProduction: false, loaded: true }),
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn(), warning: jest.fn() } }));

const textbox = (name) => screen.getByRole('textbox', { name: new RegExp(`^${name}`) });

const fillNamespaceStep = async (namespace) => {
  fireEvent.change(await screen.findByRole('textbox', { name: /^Namespace/ }), { target: { value: namespace } });
  fireEvent.change(textbox('Visningsnamn'), { target: { value: 'Nytt område' } });
  fireEvent.change(textbox('Kortkod'), { target: { value: 'no' } });
};

const clickNext = () => fireEvent.click(screen.getByRole('button', { name: /Nästa/ }));

const expectStep = (title) => screen.findByRole('heading', { level: 2, name: title });

describe('NamespaceWizard', () => {
  beforeAll(() => {
    // Radix Select and Switch rely on these in jsdom.
    window.HTMLElement.prototype.hasPointerCapture = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    window.sessionStorage.clear();
    Object.values(mockApi).forEach((mockFunction) => mockFunction.mockReset());
    mockApi.listNamespaces.mockResolvedValue(['TAKEN']);
    mockApi.listMetadataKeys.mockResolvedValue([]);
    mockApi.getLabels.mockResolvedValue([]);
    mockApi.hasEmailIntegration.mockResolvedValue(false);
  });

  it('stays on the first step while the namespace is taken', async () => {
    render(React.createElement(NamespaceWizard));
    await fillNamespaceStep('taken');

    clickNext();

    expect(await screen.findByText('Namespace "TAKEN" finns redan.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Namespace' })).toBeInTheDocument();
  });

  it('walks through the steps and creates the namespace in order', async () => {
    render(React.createElement(NamespaceWizard));
    await fillNamespaceStep('new_ns');
    expect(textbox('Namespace')).toHaveValue('NEW_NS');

    clickNext();
    await expectStep('Statusar och roller');
    expect(screen.getByLabelText('Namn för ONGOING')).toHaveValue('ONGOING');

    clickNext();
    await expectStep('Kontaktorsaker och etiketter');
    clickNext();
    await expectStep('E-postintegration');
    clickNext();
    await expectStep('Granska och skapa');

    fireEvent.click(screen.getByRole('button', { name: 'Skapa namespace' }));

    expect(await screen.findByText('Namespacet NEW_NS är skapat.')).toBeInTheDocument();
    expect(mockApi.createNamespace).toHaveBeenCalledWith(2281, {
      namespace: 'NEW_NS',
      displayName: 'Nytt område',
      shortCode: 'NO',
      notificationTTLInDays: 40,
      accessControl: false,
      notifyReporter: false,
    });
    expect(
      mockApi.createMetadata.mock.calls.map(([resourceName, , payload]) => `${resourceName}:${payload.name}`)
    ).toEqual(['statuses:NEW', 'statuses:ONGOING', 'statuses:SOLVED', 'statuses:SUSPENDED']);
    expect(mockApi.saveLabels).not.toHaveBeenCalled();
    expect(mockApi.createEmailIntegration).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Öppna namespace' })).toHaveAttribute('href', '/namespaces/NEW_NS');
  });

  it('lets a failed part be retried without creating the namespace again', async () => {
    mockApi.createMetadata.mockRejectedValueOnce({ response: { data: { message: 'Tillfälligt fel' } } });
    render(React.createElement(NamespaceWizard));
    await fillNamespaceStep('new_ns');
    for (const title of [
      'Statusar och roller',
      'Kontaktorsaker och etiketter',
      'E-postintegration',
      'Granska och skapa',
    ]) {
      clickNext();
      await expectStep(title);
    }

    fireEvent.click(screen.getByRole('button', { name: 'Skapa namespace' }));
    expect(await screen.findByText('Tillfälligt fel')).toBeInTheDocument();

    mockApi.listNamespaces.mockResolvedValue(['TAKEN', 'NEW_NS']);
    mockApi.listMetadataKeys.mockResolvedValue(['ONGOING', 'SOLVED', 'SUSPENDED']);
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen med det som återstår' }));

    expect(await screen.findByText('Namespacet NEW_NS är skapat.')).toBeInTheDocument();
    expect(mockApi.createNamespace).toHaveBeenCalledTimes(1);
    expect(mockApi.createMetadata).toHaveBeenCalledTimes(5);
    expect(mockApi.createMetadata.mock.calls[4][2]).toMatchObject({ name: 'NEW' });
  });
});
