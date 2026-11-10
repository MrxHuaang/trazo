import { Stack } from 'expo-router';

import { NuevaCitaSheet } from '@/features/agenda/nueva-cita-sheet';

/** Hoja para agendar. Parámetros opcionales: `inicio` (ISO) y `pacienteId`. */
export default function NuevaCitaRoute() {
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85, 1], sheetGrabberVisible: false }} />
      <NuevaCitaSheet />
    </>
  );
}
