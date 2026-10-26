import { render, screen } from '@testing-library/react';
import React from 'react';
import { NamespaceImportReportView } from '../namespace-import-report';

const baseReport = (overrides = {}) => ({
  outcome: 'valid',
  dryRun: true,
  allowExisting: false,
  namespace: 'NEW_NS',
  issues: [],
  plan: [],
  steps: [],
  ...overrides,
});

describe('NamespaceImportReportView', () => {
  it('lists validation issues with severity, path and message', () => {
    render(
      React.createElement(NamespaceImportReportView, {
        report: baseReport({
          outcome: 'invalid',
          issues: [
            { path: 'emailIntegration.statusForNew', message: 'Statusen "X" finns inte.', severity: 'error' },
            { path: 'namespace', message: 'Använd versaler.', severity: 'warning' },
          ],
        }),
      })
    );

    expect(screen.getByRole('status')).toHaveTextContent('Dokumentet har fel');
    expect(screen.getByText('Fel')).toBeInTheDocument();
    expect(screen.getByText('Varning')).toBeInTheDocument();
    expect(screen.getByText('emailIntegration.statusForNew')).toBeInTheDocument();
    expect(screen.getByText('Statusen "X" finns inte.')).toBeInTheDocument();
    expect(screen.getByText('1 varning som inte stoppar importen.')).toBeInTheDocument();
  });

  it('shows the plan with Swedish section names after a successful dry run', () => {
    render(
      React.createElement(NamespaceImportReportView, {
        report: baseReport({
          plan: [
            { section: 'namespaceConfig', create: 1, skip: 0, skipped: [] },
            { section: 'statuses', create: 2, skip: 1, skipped: ['NEW'] },
            { section: 'emailIntegration', create: 0, skip: 0, skipped: [] },
          ],
        }),
      })
    );

    expect(screen.getByRole('status')).toHaveTextContent('Dokumentet är giltigt');
    expect(screen.getByText('Namespace-konfiguration')).toBeInTheDocument();
    expect(screen.getByText('Statusar')).toBeInTheDocument();
    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(screen.queryByText('Utfört')).not.toBeInTheDocument();
  });

  it('shows step results with status badges and the failure message after an executed import', () => {
    render(
      React.createElement(NamespaceImportReportView, {
        report: baseReport({
          outcome: 'partial_failure',
          dryRun: false,
          plan: [{ section: 'roles', create: 2, skip: 0, skipped: [] }],
          steps: [
            { section: 'namespaceConfig', status: 'done', created: ['NEW_NS'], skipped: [] },
            { section: 'roles', status: 'failed', created: ['A'], skipped: [], error: 'roles/B: Gateway call failed' },
            { section: 'labels', status: 'not_run', created: [], skipped: [] },
          ],
        }),
      })
    );

    expect(screen.getByRole('status')).toHaveTextContent('Importen avbröts');
    expect(screen.getByText('Utfört')).toBeInTheDocument();
    expect(screen.getByText('Klar')).toBeInTheDocument();
    expect(screen.getByText('Misslyckades')).toBeInTheDocument();
    expect(screen.getByText('Ej körd')).toBeInTheDocument();
    expect(screen.getByText('roles/B: Gateway call failed')).toBeInTheDocument();
    expect(screen.queryByText('Plan')).not.toBeInTheDocument();
  });
});
