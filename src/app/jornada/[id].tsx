import { useLocalSearchParams } from 'expo-router';

import { JornadaScreen } from '@/features/solidario/jornada-screen';

/** Jornada con registro rápido de asistentes (HU-21). */
export default function JornadaRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <JornadaScreen id={id} />;
}
