import { Stack } from 'expo-router';

import { CitaDetalleSheet } from '@/features/agenda/cita-detalle-sheet';

/** Hoja con el detalle y las acciones de una cita. */
export default function CitaRoute() {
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85, 1], sheetGrabberVisible: false }} />
      <CitaDetalleSheet />
    </>
  );
}
