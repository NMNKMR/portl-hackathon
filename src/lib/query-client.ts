import {
  QueryClient,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, type AppStateStatus, Platform } from 'react-native';

/**
 * Wire once at app bootstrap.
 * Uses expo-network per TanStack Query React Native docs (preferred over NetInfo here).
 */
export function setupReactQueryOnlineManager() {
  onlineManager.setEventListener((setOnline) => {
    let initialised = false;

    const subscription = Network.addNetworkStateListener((state) => {
      initialised = true;
      setOnline(!!state.isConnected);
    });

    Network.getNetworkStateAsync()
      .then((state) => {
        if (!initialised) {
          setOnline(!!state.isConnected);
        }
      })
      .catch(() => {
        // getNetworkStateAsync can reject on some platforms/SDK versions
      });

    return () => subscription.remove();
  });
}

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

/** Call from root layout; returns unsubscribe. */
export function setupReactQueryFocusManager() {
  const subscription = AppState.addEventListener('change', onAppStateChange);
  return () => subscription.remove();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
