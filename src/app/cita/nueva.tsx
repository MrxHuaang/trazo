
import { NuevaCitaSheet } from '@/features/agenda/nueva-cita-sheet';

/** Hoja para agendar. Parámetros opcionales: `inicio` (ISO) y `pacienteId`. */
export default function NuevaCitaRoute() {
  return (
    <>
      <NuevaCitaSheet />
    </>
  );
}
