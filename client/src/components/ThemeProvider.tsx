import type { ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="discord-dashboard-theme"
    >
      <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10 app-background" aria-hidden="true" />
        <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
      </div>
    </NextThemesProvider>
  );
}
