import { TZDate } from '@date-fns/tz';
import { useEffect, useState } from 'react';

export const ZONA_HORARIA = 'America/Bogota';

export function ahoraEnColombia() {
  return new TZDate(Date.now(), ZONA_HORARIA);
}

/** Hora actual de Colombia, actualizada cada minuto. */
export function useAhora() {
  const [ahora, setAhora] = useState(ahoraEnColombia);

  useEffect(() => {
    const id = setInterval(() => setAhora(ahoraEnColombia()), 60_000);
    return () => clearInterval(id);
  }, []);

  return ahora;
}
