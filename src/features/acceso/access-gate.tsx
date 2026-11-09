import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { qk } from '@/data/keys';
import { obtenerConsultorio } from '@/data/repos/consultorio';
import { cargarDemo } from '@/data/seed';

/**
 * Provisional: si no hay consultorio, carga los datos de demostración.
 * El módulo `acceso` lo reemplaza por la bienvenida (onboarding) y el bloqueo biométrico.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    (async () => {
      if (!(await obtenerConsultorio())) {
        await cargarDemo();
        await qc.invalidateQueries();
      }
      setListo(true);
    })().catch(() => setListo(true));
  }, [qc]);

  return listo ? children : null;
}

void qk;
