import { Stack, useLocalSearchParams } from 'expo-router';

import { PacienteFormScreen } from '@/features/pacientes/paciente-form-screen';

/** Hoja para crear (`?nombre=`) o editar (`?id=`) un paciente. */
export default function NuevoPacienteRoute() {
  const { id, nombre } = useLocalSearchParams<{ id?: string; nombre?: string }>();
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents: [0.9, 1], sheetGrabberVisible: false }} />
      <PacienteFormScreen key={id ?? 'nuevo'} id={id} nombre={nombre} />
    </>
  );
}
