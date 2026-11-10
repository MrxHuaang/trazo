import { useEffect, useState } from 'react';

import { telefonoProtegido } from './verificacion';

/** null mientras se consulta; false si el teléfono no tiene código, huella ni rostro configurado. */
export function useTelefonoProtegido() {
  const [protegido, setProtegido] = useState<boolean | null>(null);
  useEffect(() => {
    let vigente = true;
    void telefonoProtegido().then((valor) => {
      if (vigente) setProtegido(valor);
    });
    return () => {
      vigente = false;
    };
  }, []);
  return protegido;
}
