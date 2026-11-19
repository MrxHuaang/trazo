import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { DatabaseGate } from '@/data/database-gate';
import { AccessGate } from '@/features/acceso/access-gate';
import { appFonts, color } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/**
 * Hojas: en iPhone, hoja nativa (formSheet). En Android, pantalla que sube desde abajo: el formSheet de
 * react-native-screens 4.30 en Expo Go fallaba al cerrarse o se abría invisible.
 */
const HOJA =
  Platform.OS === 'ios'
    ? { presentation: 'formSheet' as const, sheetAllowedDetents: [0.9], sheetGrabberVisible: false }
    : { presentation: 'modal' as const, animation: 'slide_from_bottom' as const };

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
          {/* Las hojas se declaran aquí, no dentro de cada ruta, para que cada pantalla nazca con su presentación. */}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }}>
            <Stack.Screen name="por-confirmar" options={HOJA} />
            <Stack.Screen name="cita/nueva" options={HOJA} />
            <Stack.Screen name="cita/[id]" options={HOJA} />
            <Stack.Screen name="paciente/nuevo" options={HOJA} />
            <Stack.Screen name="nota/[id]" options={HOJA} />
            <Stack.Screen name="jornada/nueva" options={HOJA} />
            <Stack.Screen name="ajustes/cupos" options={HOJA} />
            <Stack.Screen
              name="resumen"
              options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
            />
          </Stack>
        </AccessGate>
      </DatabaseGate>
    </QueryClientProvider>
  );
}
