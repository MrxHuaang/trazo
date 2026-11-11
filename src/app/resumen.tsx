import { Stack } from 'expo-router';

import { ResumenScreen } from '@/features/hoy/resumen-screen';

/** Historias a pantalla completa sobre "Hoy": al deslizar hacia abajo se ve la pantalla de atrás. */
export default function ResumenRoute() {
  return (
    <>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
      <ResumenScreen />
    </>
  );
}
