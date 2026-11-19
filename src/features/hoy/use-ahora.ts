import { useEffect, useState } from 'react';

import { ahora as ahoraEnColombia } from '@/lib/dates';

/** Hora de Colombia; se refresca cuando cambia el minuto. */
export function useAhora() {
  const [ahora, setAhora] = useState(ahoraEnColombia);

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval> | undefined;
    const tick = () => setAhora(ahoraEnColombia());
    // Primer tick alineado al cambio de minuto; si no, "en 25 min" puede ir casi un minuto atrasado.
    const espera = setTimeout(() => {
      tick();
      intervalo = setInterval(tick, 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(espera);
      if (intervalo) clearInterval(intervalo);
    };
  }, []);

  return ahora;
}
