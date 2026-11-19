import { useLocalSearchParams } from 'expo-router';

import { PacienteFormScreen } from '@/features/pacientes/paciente-form-screen';

/** Hoja para crear (`?nombre=`) o editar (`?id=`) un paciente. */
export default function NuevoPacienteRoute() {
  const { id, nombre } = useLocalSearchParams<{ id?: string; nombre?: string }>();
  return (
    <>
      <PacienteFormScreen key={id ?? 'nuevo'} id={id} nombre={nombre} />
    </>
  );
}
