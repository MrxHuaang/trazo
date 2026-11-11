import { Stack } from 'expo-router';

import { CalmaScreen } from '@/features/calma/calma-screen';

export default function CalmaRoute() {
  return (
    <>
      {/* Pantalla completa sin gesto de cierre: el paciente sostiene el teléfono sin cerrarla por accidente. */}
      <Stack.Screen options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <CalmaScreen />
    </>
  );
}
