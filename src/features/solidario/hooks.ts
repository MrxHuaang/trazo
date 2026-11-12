/**
 * Hooks (TanStack Query) del programa solidario. Llaves bajo qk.jornadas, qk.asistentes y qk.recursos;
 * las cifras del informe se guardan bajo la llave de la entidad que cuentan, para que las mutaciones
 * de otros módulos (citas, pagos, seguimientos) las actualicen solas.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useConsultorio, useCrearPaciente, useCrearSeguimiento } from '@/data/hooks';
import { qk } from '@/data/keys';
import type { Asistente, Paciente } from '@/domain/types';
import { hoyClave } from '@/lib/dates';
import { nuevoId } from '@/lib/id';

import type { CifrasInforme } from './informe';
import * as repo from './repo';
import { fechaSeguimientoAsistente, motivoSeguimientoJornada } from './rules';

/* ---------- Jornadas ---------- */

export const useJornadasProximas = () =>
  useQuery({ queryKey: [...qk.jornadas, 'proximas'], queryFn: repo.listarJornadasProximas });

export const useJornadasAnteriores = (limite = 3) =>
  useQuery({ queryKey: [...qk.jornadas, 'anteriores', limite], queryFn: () => repo.listarJornadasAnteriores(limite) });

/** Todas las jornadas, próximas y pasadas (mapa solidario). */
export const useJornadas = () => useQuery({ queryKey: [...qk.jornadas, 'todas'], queryFn: repo.listarJornadas });

export const useJornada = (id?: string) =>
  useQuery({ queryKey: [...qk.jornadas, 'una', id], queryFn: () => repo.obtenerJornada(id!), enabled: !!id });

/** Jornadas a las que asistió un paciente (para la historia de su ficha). */
export const useJornadasDePaciente = (pacienteId?: string) =>
  useQuery({
    queryKey: [...qk.jornadas, 'paciente', pacienteId],
    queryFn: () => repo.jornadasDePaciente(pacienteId!),
    enabled: !!pacienteId,
  });

const useInvalidarJornadas = () => {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: qk.jornadas }), qc.invalidateQueries({ queryKey: qk.asistentes })]);
};

export function useCrearJornada() {
  const invalidar = useInvalidarJornadas();
  return useMutation({ mutationFn: repo.crearJornada, onSuccess: invalidar });
}

export function useActualizarJornada() {
  const invalidar = useInvalidarJornadas();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: repo.NuevaJornada }) => repo.actualizarJornada(id, datos),
    onSuccess: invalidar,
  });
}

export function useEliminarJornada() {
  const qc = useQueryClient();
  const invalidar = useInvalidarJornadas();
  return useMutation({
    mutationFn: repo.eliminarJornada,
    onSuccess: () => Promise.all([invalidar(), qc.invalidateQueries({ queryKey: qk.seguimientos })]),
  });
}

/* ---------- Asistentes ---------- */

const llaveAsistentes = (jornadaId: string) => [...qk.asistentes, 'jornada', jornadaId] as const;

export const useAsistentes = (jornadaId?: string) =>
  useQuery({
    queryKey: llaveAsistentes(jornadaId ?? ''),
    queryFn: () => repo.listarAsistentes(jornadaId!),
    enabled: !!jornadaId,
  });

/** Registra un asistente y lo muestra en la lista al instante (actualización optimista). */
export function useCrearAsistente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.crearAsistente,
    onMutate: async (d: repo.NuevoAsistente) => {
      const llave = llaveAsistentes(d.jornadaId);
      await qc.cancelQueries({ queryKey: llave });
      const previo = qc.getQueryData<Asistente[]>(llave);
      const temporal: Asistente = {
        id: d.id ?? nuevoId(),
        jornadaId: d.jornadaId,
        pacienteId: null,
        nombre: d.nombre.trim(),
        telefono: repo.limpiarTelefono(d.telefono),
        requiereSeguimiento: d.requiereSeguimiento,
        consentimientoDatos: d.consentimientoDatos,
        creadoEn: new Date().toISOString(),
      };
      qc.setQueryData<Asistente[]>(llave, (lista = []) => [temporal, ...lista]);
      return { llave, previo };
    },
    onError: (_e, _d, ctx) => {
      if (ctx) qc.setQueryData(ctx.llave, ctx.previo);
    },
    onSettled: () =>
      Promise.all([qc.invalidateQueries({ queryKey: qk.asistentes }), qc.invalidateQueries({ queryKey: qk.jornadas })]),
  });
}

export type DatosAsistente = Pick<repo.NuevoAsistente, 'nombre' | 'telefono' | 'requiereSeguimiento' | 'consentimientoDatos'>;

/**
 * HU-21 + RN-08: registra el asistente y, si requiere seguimiento,
 * crea un seguimiento a 7 días ligado al asistente.
 */
export function useRegistrarAsistente() {
  const crearAsistente = useCrearAsistente();
  const crearSeguimiento = useCrearSeguimiento();

  const registrar = async (jornada: { id: string; titulo: string; inicio: string }, datos: DatosAsistente) => {
    const id = nuevoId();
    const asistente = await crearAsistente.mutateAsync({ id, jornadaId: jornada.id, ...datos });
    if (datos.requiereSeguimiento) {
      await crearSeguimiento.mutateAsync({
        nombre: asistente.nombre,
        telefono: asistente.telefono,
        fechaObjetivo: fechaSeguimientoAsistente(jornada.inicio, hoyClave()),
        motivo: motivoSeguimientoJornada(jornada.titulo),
        asistenteId: asistente.id,
      });
    }
    return asistente;
  };

  return { registrar, guardando: crearAsistente.isPending || crearSeguimiento.isPending };
}

export function useEliminarAsistente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: repo.eliminarAsistente,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: qk.asistentes }),
        qc.invalidateQueries({ queryKey: qk.jornadas }),
        qc.invalidateQueries({ queryKey: qk.seguimientos }),
      ]),
  });
}

/** Liga un asistente con una ficha existente o nueva y le pasa sus seguimientos. */
export function useVincularAsistente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ asistenteId, pacienteId }: { asistenteId: string; pacienteId: string }) =>
      repo.vincularPaciente(asistenteId, pacienteId),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: qk.asistentes }),
        qc.invalidateQueries({ queryKey: qk.jornadas }),
        qc.invalidateQueries({ queryKey: qk.seguimientos }),
        qc.invalidateQueries({ queryKey: qk.pacientes }),
      ]),
  });
}

/** "Convertir en paciente": crea la ficha como persona afectada por el sismo y la liga al asistente. */
export function useConvertirEnPaciente() {
  const crearPaciente = useCrearPaciente();
  const vincular = useVincularAsistente();

  const convertir = async (a: Asistente): Promise<Paciente> => {
    const paciente = await crearPaciente.mutateAsync({
      nombre: a.nombre,
      telefono: a.telefono,
      afectadoSismo: true,
      tarifa: 'social',
      autorizaDatos: a.consentimientoDatos,
    });
    await vincular.mutateAsync({ asistenteId: a.id, pacienteId: paciente.id });
    return paciente;
  };

  return {
    convertir,
    vincular: (asistenteId: string, pacienteId: string) => vincular.mutateAsync({ asistenteId, pacienteId }),
    guardando: crearPaciente.isPending || vincular.isPending,
  };
}

/* ---------- Líneas de ayuda ---------- */

export const useRecursos = () => useQuery({ queryKey: qk.recursos, queryFn: repo.listarRecursos, staleTime: Infinity });

/* ---------- Informe de impacto (HU-23) ---------- */

export function useInformeMes(mes: string) {
  const consultorio = useConsultorio();
  const citas = useQuery({ queryKey: [...qk.citas, 'informe', mes], queryFn: () => repo.cifrasCitasMes(mes), placeholderData: keepPreviousData });
  const donadas = useQuery({ queryKey: [...qk.pagos, 'informe', mes], queryFn: () => repo.sesionesDonadasMes(mes), placeholderData: keepPreviousData });
  const jornadas = useQuery({ queryKey: [...qk.jornadas, 'informe', mes], queryFn: () => repo.cifrasJornadasMes(mes), placeholderData: keepPreviousData });
  const hechos = useQuery({ queryKey: [...qk.seguimientos, 'informe', mes], queryFn: () => repo.seguimientosHechosMes(mes), placeholderData: keepPreviousData });

  const cifras: CifrasInforme | undefined =
    citas.data && donadas.data !== undefined && jornadas.data && hechos.data !== undefined && consultorio.data !== undefined
      ? {
          personasAfectadas: citas.data.personasAfectadas,
          sesionesSolidarias: citas.data.sesionesSolidarias,
          sesionesDonadas: donadas.data,
          minutosPorSesion: consultorio.data?.duracionCita ?? 50,
          jornadas: jornadas.data.jornadas,
          asistentes: jornadas.data.asistentes,
          seguimientosHechos: hechos.data,
        }
      : undefined;

  const error = citas.error ?? donadas.error ?? jornadas.error ?? hechos.error ?? consultorio.error;
  return { cifras, consultorio: consultorio.data ?? null, error };
}
