/**
 * Hooks de datos del módulo pacientes (TanStack Query). Toda llave empieza por una base de `qk`
 * para que las mutaciones de otros módulos las invaliden sin conocerlas.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/data/keys';
import { archivarPaciente } from '@/data/repos/pacientes';
import { pagosPaciente } from '@/data/repos/pagos';

import * as repo from './repo';

/* ---------- Lista ---------- */

/** Próxima y última cita por paciente. Cuelga de `qk.citas` para refrescarse cuando cambia la agenda. */
export const useResumenCitasPacientes = () =>
  useQuery({ queryKey: [...qk.citas, 'resumen-pacientes'], queryFn: () => repo.resumenCitasPacientes() });

/* ---------- Ficha ---------- */

export const usePagosPaciente = (pacienteId?: string) =>
  useQuery({
    queryKey: [...qk.pagos, 'paciente', pacienteId],
    queryFn: () => pagosPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export function useArchivarPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archivar }: { id: string; archivar: boolean }) => archivarPaciente(id, archivar),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.pacientes }),
  });
}

/* ---------- Consentimientos (HU-11) ---------- */

export const useConsentimientos = (pacienteId?: string) =>
  useQuery({
    queryKey: [...qk.consentimientos, 'paciente', pacienteId],
    queryFn: () => repo.listarConsentimientos(pacienteId!),
    enabled: !!pacienteId,
  });

export function useRegistrarConsentimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pacienteId: string) => repo.registrarConsentimiento(pacienteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.consentimientos }),
  });
}

/* ---------- Notas de sesión (HU-12) ---------- */

/** Notas del paciente sin contenido: la historia solo muestra "Nota privada" y la fecha. */
export const useNotasPaciente = (pacienteId?: string) =>
  useQuery({
    queryKey: [...qk.notas, 'paciente', pacienteId],
    queryFn: () => repo.listarNotasPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export const useContextoNota = (id?: string, pacienteId?: string) =>
  useQuery({
    queryKey: [...qk.notas, 'contexto', id, pacienteId],
    queryFn: () => repo.contextoNota(id!, pacienteId),
    enabled: !!id,
  });

/** Llave del contenido: se borra de la caché al bloquear la nota. */
export const llaveContenidoNota = [...qk.notas, 'contenido'] as const;

/** El contenido solo se consulta con la nota abierta y no se guarda en caché al cerrarla. */
export const useContenidoNota = (notaId: string | null, abierta: boolean) =>
  useQuery({
    queryKey: [...llaveContenidoNota, notaId],
    queryFn: () => repo.obtenerContenidoNota(notaId!),
    enabled: abierta && !!notaId,
    gcTime: 0,
  });

export function useGuardarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.guardarNota,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notas }),
  });
}
