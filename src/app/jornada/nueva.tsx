import { Stack, useLocalSearchParams } from 'expo-router';

import { JornadaFormSheet } from '@/features/solidario/jornada-form-sheet';

/** Hoja para programar una jornada (HU-20). Con `?id=` edita una existente. */
export default function NuevaJornadaRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85, 1], sheetGrabberVisible: false }} />
      <JornadaFormSheet id={id} />
    </>
  );
}
