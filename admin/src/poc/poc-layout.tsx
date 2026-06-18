import { Separator } from '@components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@components/ui/sidebar';
import { AppSidebar } from '@poc/app-sidebar';
import Head from 'next/head';
import * as React from 'react';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Draken';

interface PocLayoutProps {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PocLayout({ title, breadcrumb, actions, children }: PocLayoutProps) {
  return (
    <>
      <Head>
        <title>{`${title} – ${appName} admin`}</title>
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
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-col">
              {breadcrumb && <span className="text-xs text-muted-foreground">{breadcrumb}</span>}
              <h1 className="text-base font-semibold leading-none">{title}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          </header>
          <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-6 outline-none">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
