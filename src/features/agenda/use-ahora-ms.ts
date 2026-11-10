import { useEffect, useState } from 'react';

/** Instante actual (ms), actualizado cada minuto: mueve la línea de "ahora" y apaga los huecos que ya pasaron. */
export function useAhoraMs() {
  const [ms, setMs] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return ms;
}
