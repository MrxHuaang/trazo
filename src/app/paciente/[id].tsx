import { useLocalSearchParams } from 'expo-router';

import { FichaPacienteScreen } from '@/features/pacientes/ficha-screen';

export default function PacienteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FichaPacienteScreen key={id} id={id} />;
}
