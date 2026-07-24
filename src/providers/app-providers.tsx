import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <AuthProvider>{children}</AuthProvider>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
