import { useLocalSearchParams } from 'expo-router';

import { JornadaFormSheet } from '@/features/solidario/jornada-form-sheet';

/** Hoja para programar una jornada (HU-20). Con `?id=` edita una existente. */
export default function NuevaJornadaRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <>
      <JornadaFormSheet id={id} />
    </>
  );
}
