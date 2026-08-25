export type AdminEnvironmentKind = 'production' | 'test';

interface AdminEnvironmentVisuals {
  label: string;
  pageTitleLabel: string | null;
  description: string;
  headerClassName: string;
  badgeClassName: string;
  sidebarAccentClassName: string;
}

export type AdminEnvironmentState =
  | ({
      status: 'checking';
      kind: 'unknown';
    } & AdminEnvironmentVisuals)
  | ({
      status: 'resolved';
      kind: AdminEnvironmentKind;
    } & AdminEnvironmentVisuals);

const visualsByKind: Record<AdminEnvironmentKind, AdminEnvironmentVisuals> = {
  production: {
    label: 'Produktionsmiljö',
    pageTitleLabel: 'Produktion',
    description: 'Ändringar gäller produktionsmiljön.',
    headerClassName: 'border-b-2 border-b-rose-700 bg-rose-50/95 dark:border-b-rose-500 dark:bg-rose-950/30',
    badgeClassName: 'border-rose-700 bg-rose-700 text-white dark:border-rose-400 dark:bg-rose-500 dark:text-rose-950',
    sidebarAccentClassName: 'border-l-rose-700 dark:border-l-rose-500',
  },
  test: {
    label: 'Testmiljö',
    pageTitleLabel: 'Test',
    description: 'Ändringar gäller testmiljön.',
    headerClassName: 'border-b-2 border-b-sky-700 bg-sky-50/95 dark:border-b-sky-400 dark:bg-sky-950/30',
    badgeClassName: 'border-sky-700 bg-sky-700 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-sky-950',
    sidebarAccentClassName: 'border-l-sky-700 dark:border-l-sky-400',
  },
};

const checkingEnvironment: AdminEnvironmentState = {
  status: 'checking',
  kind: 'unknown',
  label: 'Kontrollerar miljö',
  pageTitleLabel: null,
  description: 'Kontrollerar vilken miljö adminpanelen är kopplad till.',
  headerClassName: 'border-b bg-background',
  badgeClassName: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  sidebarAccentClassName: 'border-l-border',
};

export function adminEnvironmentFromKind(kind: AdminEnvironmentKind): AdminEnvironmentState {
  return {
    status: 'resolved',
    kind,
    ...visualsByKind[kind],
  };
}

export function checkingAdminEnvironment(): AdminEnvironmentState {
  return checkingEnvironment;
}

export function shouldTreatAsProduction(environment: AdminEnvironmentState): boolean {
  return environment.kind !== 'test';
}
