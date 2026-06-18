import LoginGuard from '@components/login-guard/login-guard';
import { ConfirmationDialogContextProvider, GuiProvider } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import 'dayjs/locale/sv';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

export function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [colorScheme, basePath, setBasePath] = useLocalStorage(
    useShallow((state) => [state.colorScheme, state.basePath, state.setBasePath])
  );

  useEffect(() => {
    const envBasePath = process?.env?.NEXT_PUBLIC_BASE_PATH ?? '';
    if (basePath !== envBasePath) {
      setBasePath(envBasePath);
    }
  }, [basePath, setBasePath]);

  // shadcn PoC routes are self-contained: they bring their own providers
  // (next-themes + sidebar) and must not be gated by the @sk-web-gui
  // GuiProvider or the auth LoginGuard.
  if (router.pathname.startsWith('/poc')) {
    return <Component {...pageProps} />;
  }

  return (
    <GuiProvider colorScheme={colorScheme}>
      <ConfirmationDialogContextProvider>
        <LoginGuard>
          <Component {...pageProps} />
        </LoginGuard>
      </ConfirmationDialogContextProvider>
    </GuiProvider>
  );
}
