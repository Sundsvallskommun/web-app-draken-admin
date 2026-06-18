import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

/**
 * next-themes provider for the PoC. Toggles the `dark` class on <html>, which
 * combines with the `shadcn-poc` class (added by the PoC layout) so the scoped
 * dark variables in shadcn-poc.css (`.shadcn-poc.dark`) apply.
 */
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  );
}
