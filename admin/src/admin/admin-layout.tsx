import { Separator } from '@components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@components/ui/sidebar';
import { AppSidebar } from '@admin/app-sidebar';
import { EnvironmentIndicator } from '@admin/environment-indicator';
import { cn } from '@utils/cn';
import { useAdminEnvironment } from '@utils/use-is-production-env.hook';
import Head from 'next/head';
import * as React from 'react';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Draken';

interface AdminLayoutProps {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminLayout({ title, breadcrumb, actions, children }: AdminLayoutProps) {
  const { environment } = useAdminEnvironment();
  const pageTitle =
    environment.pageTitleLabel ? `${title} – ${environment.pageTitleLabel} – ${appName}` : `${title} – ${appName}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Hoppa till innehåll
      </a>

      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header
            className={cn(
              'sticky top-0 z-10 flex min-h-16 shrink-0 flex-wrap items-center gap-2 px-4 py-2',
              environment.headerClassName
            )}
          >
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex min-w-0 flex-col">
              {breadcrumb && <span className="text-xs text-muted-foreground">{breadcrumb}</span>}
              <h1 className="truncate text-base font-semibold leading-none">{title}</h1>
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <EnvironmentIndicator environment={environment} />
              {actions}
            </div>
          </header>
          <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-6 outline-none">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
