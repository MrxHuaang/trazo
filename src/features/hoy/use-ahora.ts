import { useEffect, useState } from 'react';

import { ahora as ahoraEnColombia } from '@/lib/dates';

/** Hora actual de Colombia, actualizada cada minuto (al cambiar el minuto del reloj). */
export function useAhora() {
  const [ahora, setAhora] = useState(ahoraEnColombia);

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval> | undefined;
    const tick = () => setAhora(ahoraEnColombia());
    // Alinea el primer tick con el cambio de minuto para que "en 25 min" no quede atrasado.
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
