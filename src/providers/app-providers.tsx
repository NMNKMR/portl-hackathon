import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';

import {
  queryClient,
  setupReactQueryFocusManager,
  setupReactQueryOnlineManager,
} from '@/lib/query-client';
import { hydrateThemePreference } from '@/lib/storage';
import { AuthProvider } from '@/providers/auth-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    setupReactQueryOnlineManager();
    const removeFocus = setupReactQueryFocusManager();
    void hydrateThemePreference();
    return removeFocus;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
