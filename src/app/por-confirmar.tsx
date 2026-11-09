import { Stack } from 'expo-router';

import { PorConfirmarScreen } from '@/features/hoy/por-confirmar-screen';

export default function PorConfirmarRoute() {
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: false }} />
      <PorConfirmarScreen />
    </>
  );
}
