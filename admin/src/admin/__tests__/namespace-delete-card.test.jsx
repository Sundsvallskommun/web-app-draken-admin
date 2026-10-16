import { render, screen } from '@testing-library/react';
import React from 'react';
import { DeleteReportView } from '../namespace-delete-card';

const baseReport = (overrides = {}) => ({
  outcome: 'ready',
  dryRun: true,
  namespace: 'NS',
  errandCount: 0,
  plan: [],
  steps: [],
  ...overrides,
});

describe('DeleteReportView', () => {
  it('refuses with the errand count when the namespace has errands', () => {
    render(React.createElement(DeleteReportView, { report: baseReport({ outcome: 'has_errands', errandCount: 12 }) }));

    expect(screen.getByRole('status')).toHaveTextContent('Namespacet har ärenden');
    expect(screen.getByText('12 ärenden i namespacet.')).toBeInTheDocument();
  });

  it('lists what would be deleted after an inspection', () => {
    render(
      React.createElement(DeleteReportView, {
        report: baseReport({
          plan: [
            { section: 'phaseTransitions', items: ['INTAKE → WORK'] },
            { section: 'statuses', items: ['NEW', 'SOLVED'] },
            { section: 'namespaceConfig', items: ['NS'] },
          ],
        }),
      })
    );

    expect(screen.getByRole('status')).toHaveTextContent('Namespacet kan tas bort');
    expect(screen.getByText('Tas bort (4 delar)')).toBeInTheDocument();
    expect(screen.getByText('Fasövergångar')).toBeInTheDocument();
    expect(screen.getByText('NEW, SOLVED')).toBeInTheDocument();
  });

  it('shows per-step results and the error after an executed delete', () => {
    render(
      React.createElement(DeleteReportView, {
        report: baseReport({
          outcome: 'partial_failure',
          dryRun: false,
          plan: [{ section: 'statuses', items: ['NEW', 'SOLVED'] }],
          steps: [
            { section: 'emailIntegration', status: 'skipped', deleted: [] },
            { section: 'statuses', status: 'failed', deleted: ['NEW'], error: 'statuses/SOLVED: in use' },
            { section: 'namespaceConfig', status: 'not_run', deleted: [] },
          ],
        }),
      })
    );

    expect(screen.getByRole('status')).toHaveTextContent('Borttagningen avbröts');
    expect(screen.getByText('Inget att ta bort')).toBeInTheDocument();
    expect(screen.getByText('Misslyckades')).toBeInTheDocument();
    expect(screen.getByText('Ej körd')).toBeInTheDocument();
    expect(screen.getByText('statuses/SOLVED: in use')).toBeInTheDocument();
    expect(screen.queryByText(/Tas bort \(/)).not.toBeInTheDocument();
  });
});
