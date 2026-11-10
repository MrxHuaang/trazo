import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/data/keys';

import { listarParaContactar, registrarContacto } from './repo';

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
