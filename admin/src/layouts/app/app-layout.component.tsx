import { Toaster } from '@components/ui/sonner';
import LoginGuard from '@components/login-guard/login-guard';
import { ThemeProvider } from '@poc/theme-provider';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import 'dayjs/locale/sv';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

export function MyApp({ Component, pageProps }: AppProps) {
  const [basePath, setBasePath] = useLocalStorage(useShallow((state) => [state.basePath, state.setBasePath]));

  useEffect(() => {
    const envBasePath = process?.env?.NEXT_PUBLIC_BASE_PATH ?? '';
    if (basePath !== envBasePath) {
      setBasePath(envBasePath);
    }
  }, [basePath, setBasePath]);

  return (
    <ThemeProvider>
      <LoginGuard>
        <Component {...pageProps} />
      </LoginGuard>
      <Toaster />
    </ThemeProvider>
  );
}
