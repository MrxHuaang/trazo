import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/data/keys';

import { listarParaContactar, registrarContacto, resumenCitasSemana, resumenPagosSemana } from './repo';
import { RESUMEN_VACIO, type ResumenSemana } from './rules';

/** RN-06. La llave cuelga de `citas` para refrescarse cuando cambia el estado de una cita. */
export const useParaContactar = () =>
  useQuery({ queryKey: [...qk.citas, 'para-contactar'], queryFn: () => listarParaContactar() });

export function useRegistrarContacto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registrarContacto,
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: qk.seguimientos }), qc.invalidateQueries({ queryKey: qk.citas })]),
  });
}

/** Dos consultas separadas para que citas y cobros se invaliden cada uno con su llave. */
export function useResumenSemana(lunes: string): { resumen: ResumenSemana; cargando: boolean } {
  const citas = useQuery({ queryKey: [...qk.citas, 'resumen-semana', lunes], queryFn: () => resumenCitasSemana(lunes) });
  const pagos = useQuery({ queryKey: [...qk.pagos, 'resumen-semana', lunes], queryFn: () => resumenPagosSemana(lunes) });
  return {
    resumen: { ...RESUMEN_VACIO, ...citas.data, ...pagos.data },
    cargando: citas.isPending || pagos.isPending,
  };
}
