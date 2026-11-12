import { Stack, useLocalSearchParams } from 'expo-router';

import { NotaScreen } from '@/features/pacientes/nota-screen';

/** Nota de sesión: `id` es el id de una cita (o de una nota sin cita), o `nueva` con `?pacienteId=`. */
export default function NotaRoute() {
  const { id, pacienteId } = useLocalSearchParams<{ id: string; pacienteId?: string }>();
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85, 1], sheetGrabberVisible: false }} />
      <NotaScreen key={`${id}-${pacienteId ?? ''}`} id={id} pacienteId={pacienteId} />
    </>
  );
}
