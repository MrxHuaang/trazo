import { Stack } from 'expo-router';

import { CuposSheet } from '@/features/solidario/cupos-sheet';

/** Hoja de cupos solidarios y tarifa social (HU-18). */
export default function CuposRoute() {
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85, 1], sheetGrabberVisible: false }} />
      <CuposSheet />
    </>
  );
}
