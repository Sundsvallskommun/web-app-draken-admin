import '@styles/tailwind.scss';
import { ReactNode } from 'react';
import AppLayout from '@layouts/app/app-layout.component';
import i18nConfig from './i18nConfig';

export const generateStaticParams = () => i18nConfig.locales.map((locale) => ({ locale }));

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
};

export default RootLayout;
