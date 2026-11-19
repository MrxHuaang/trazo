/**
 * Hooks de disponibilidad y bloqueos. Las llaves cuelgan de `qk.disponibilidad` y `qk.bloqueos`
 * para que cualquier mutación pueda invalidarlas por entidad.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/data/keys';
import { listarCitasEntre } from '@/data/repos/citas';

import * as repo from './repo';

// Citas

/** Incluye canceladas porque hacen falta para quitar sus avisos locales. */
export const useCitasParaAvisos = (desde: string, hasta: string) =>
  useQuery({ queryKey: [...qk.citas, 'avisos', desde, hasta], queryFn: () => listarCitasEntre(desde, hasta, true) });

/** Mismas llaves que los hooks, así la búsqueda del próximo hueco reutiliza la caché. */
export const consultasDeHuecos = (desde: string, hasta: string) => ({
  disponibilidad: { queryKey: [...qk.disponibilidad, 'lista'], queryFn: repo.listarDisponibilidad },
  bloqueos: { queryKey: [...qk.bloqueos, 'rango', desde, hasta], queryFn: () => repo.listarBloqueosEntre(desde, hasta) },
  citas: { queryKey: [...qk.citas, 'rango', desde, hasta], queryFn: () => listarCitasEntre(desde, hasta) },
});

// Disponibilidad

export const useDisponibilidad = () =>
  useQuery({ queryKey: [...qk.disponibilidad, 'lista'], queryFn: repo.listarDisponibilidad });

export function useGuardarFranja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: string; datos: repo.NuevaFranja }) =>
      id ? repo.actualizarFranja(id, datos) : repo.crearFranja(datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.disponibilidad }),
  });
}

export function useBorrarFranja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.borrarFranja,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.disponibilidad }),
  });
}

// Bloqueos

/** Bloqueos que terminan después de `desde` (ISO). */
export const useBloqueosVigentes = (desde: string) =>
  useQuery({ queryKey: [...qk.bloqueos, 'vigentes', desde], queryFn: () => repo.listarBloqueosVigentes(desde) });

/** Bloqueos que se cruzan con [desde, hasta). */
export const useBloqueosEntre = (desde: string, hasta: string) =>
  useQuery({ queryKey: [...qk.bloqueos, 'rango', desde, hasta], queryFn: () => repo.listarBloqueosEntre(desde, hasta) });

export function useGuardarBloqueo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: string; datos: repo.NuevoBloqueo }) =>
      id ? repo.actualizarBloqueo(id, datos) : repo.crearBloqueo(datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.bloqueos }),
  });
}

export function useBorrarBloqueo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.borrarBloqueo,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.bloqueos }),
  });
}
