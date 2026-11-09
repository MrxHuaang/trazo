/**
 * Hooks compartidos de datos (TanStack Query) para las entidades que usan varios módulos.
 * Cada módulo puede crear sus propios hooks en su carpeta usando `qk` y los repositorios.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { EstadoCita, MetodoPago } from '@/domain/types';
import { fechaClave } from '@/lib/dates';

import { qk } from './keys';
import * as citas from './repos/citas';
import * as consultorio from './repos/consultorio';
import * as pacientes from './repos/pacientes';
import * as pagos from './repos/pagos';
import * as seguimientos from './repos/seguimientos';

/* ---------- Consultorio ---------- */
export const useConsultorio = () => useQuery({ queryKey: qk.consultorio, queryFn: consultorio.obtenerConsultorio });

export function useActualizarConsultorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: consultorio.actualizarConsultorio,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.consultorio }),
  });
}

/* ---------- Pacientes ---------- */
export const usePacientes = (filtro: pacientes.FiltroPacientes = {}) =>
  useQuery({ queryKey: [...qk.pacientes, 'lista', filtro], queryFn: () => pacientes.listarPacientes(filtro) });

export const usePaciente = (id?: string) =>
  useQuery({ queryKey: [...qk.pacientes, 'uno', id], queryFn: () => pacientes.obtenerPaciente(id!), enabled: !!id });

export function useCrearPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacientes.crearPaciente,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.pacientes }),
  });
}

export function useActualizarPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Partial<pacientes.NuevoPaciente> }) => pacientes.actualizarPaciente(id, cambios),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: qk.pacientes }), qc.invalidateQueries({ queryKey: qk.citas })]),
  });
}

/* ---------- Citas ---------- */
export const useCitasEntre = (desde: string, hasta: string) =>
  useQuery({ queryKey: [...qk.citas, 'rango', desde, hasta], queryFn: () => citas.listarCitasEntre(desde, hasta) });

export const useCitasDelDia = (clave = fechaClave()) =>
  useQuery({ queryKey: [...qk.citas, 'dia', clave], queryFn: () => citas.listarCitasDelDia(clave) });

export const useCita = (id?: string) =>
  useQuery({ queryKey: [...qk.citas, 'una', id], queryFn: () => citas.obtenerCita(id!), enabled: !!id });

export const useCitasPaciente = (pacienteId?: string) =>
  useQuery({
    queryKey: [...qk.citas, 'paciente', pacienteId],
    queryFn: () => citas.listarCitasPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export const useCitasPorConfirmar = () =>
  useQuery({ queryKey: [...qk.citas, 'por-confirmar'], queryFn: () => citas.citasPorConfirmar() });

export const useCitasSolicitadas = () =>
  useQuery({ queryKey: [...qk.citas, 'solicitadas'], queryFn: citas.citasSolicitadas });

export const useCuposSolidariosSemana = (clave = fechaClave()) =>
  useQuery({ queryKey: [...qk.citas, 'cupos', clave], queryFn: () => citas.contarSolidariasSemana(clave) });

const useInvalidarCitas = () => {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: qk.citas }), qc.invalidateQueries({ queryKey: qk.pagos })]);
};

export function useCrearCita() {
  const invalidar = useInvalidarCitas();
  return useMutation({ mutationFn: citas.crearCita, onSuccess: invalidar });
}

export function useActualizarCita() {
  const invalidar = useInvalidarCitas();
  return useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Parameters<typeof citas.actualizarCita>[1] }) => citas.actualizarCita(id, cambios),
    onSuccess: invalidar,
  });
}

export function useCambiarEstadoCita() {
  const invalidar = useInvalidarCitas();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoCita }) => citas.cambiarEstadoCita(id, estado),
    onSuccess: invalidar,
  });
}

export function useMarcarRecordada() {
  const invalidar = useInvalidarCitas();
  return useMutation({ mutationFn: citas.marcarRecordada, onSuccess: invalidar });
}

/* ---------- Pagos ---------- */
export const usePagosMes = (mes: string) =>
  useQuery({ queryKey: [...qk.pagos, 'mes', mes], queryFn: () => pagos.listarPagosMes(mes) });

export const usePagosPendientes = () => useQuery({ queryKey: [...qk.pagos, 'pendientes'], queryFn: pagos.pagosPendientes });

export const usePagoDeCita = (citaId?: string) =>
  useQuery({ queryKey: [...qk.pagos, 'cita', citaId], queryFn: () => pagos.pagoDeCita(citaId!), enabled: !!citaId });

export const useResumenMes = (mes: string, tarifaReferencia = 0) =>
  useQuery({ queryKey: [...qk.pagos, 'resumen', mes, tarifaReferencia], queryFn: () => pagos.resumenMes(mes, tarifaReferencia) });

export function useRegistrarPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ citaId, metodo, monto }: { citaId: string; metodo: MetodoPago; monto?: number }) => pagos.registrarPago(citaId, metodo, monto),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.pagos }),
  });
}

/* ---------- Seguimientos ---------- */
export const useSeguimientos = (filtro: seguimientos.FiltroSeguimientos = {}) =>
  useQuery({ queryKey: [...qk.seguimientos, filtro], queryFn: () => seguimientos.listarSeguimientos(filtro) });

export function useCrearSeguimiento() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: seguimientos.crearSeguimiento, onSuccess: () => qc.invalidateQueries({ queryKey: qk.seguimientos }) });
}

export function useActualizarSeguimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Parameters<typeof seguimientos.actualizarSeguimiento>[1] }) =>
      seguimientos.actualizarSeguimiento(id, cambios),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.seguimientos }),
  });
}
