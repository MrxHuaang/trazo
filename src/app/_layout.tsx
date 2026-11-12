import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { DatabaseGate } from '@/data/database-gate';
import { AccessGate } from '@/features/acceso/access-gate';
import { appFonts, color } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1 } } }),
  );

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <DatabaseGate>
        <AccessGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }} />
        </AccessGate>
      </DatabaseGate>
    </QueryClientProvider>
  );
}
