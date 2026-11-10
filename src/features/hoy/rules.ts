/**
 * Reglas puras de la bandeja "Hoy" (HU-02). Reciben la hora de referencia en milisegundos
 * para que sean fáciles de probar y no dependan del reloj.
 */
import type { CitaConPaciente, EstadoCita } from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto, minutosDelDia, sumarDias, tiempoRelativo } from '@/lib/dates';
import type { TraceNode } from '@/ui';

/** Ventana mínima del día que representa el Trazo (se amplía si hay citas por fuera). */
const DIA_INICIO = 7 * 60;
const DIA_FIN = 19 * 60;
/** El Trazo está agitado hasta este punto; las citas se dibujan en la parte en calma. */
const CALMA_DESDE = 0.3;

const ms = (iso: string) => new Date(iso).getTime();

/** Una cita ya terminó si pasó su hora de fin o si ya se registró la asistencia. */
export const citaTerminada = (c: CitaConPaciente, ahoraMs: number) =>
  ms(c.fin) <= ahoraMs || c.estado === 'asistio' || c.estado === 'no_asistio';

/** Primera cita confirmada que aún no termina (puede estar en curso). */
export function proximaCita(citas: CitaConPaciente[], ahoraMs: number) {
  return citas
    .filter((c) => c.estado === 'confirmada' && !citaTerminada(c, ahoraMs))
    .sort((a, b) => ms(a.inicio) - ms(b.inicio))[0];
}

/** Citas confirmadas posteriores a la próxima, en orden (las solicitadas van en "Solicitudes"). */
export function siguientesCitas(citas: CitaConPaciente[], ahoraMs: number) {
  const proxima = proximaCita(citas, ahoraMs);
  return citas
    .filter((c) => c.estado === 'confirmada' && c.id !== proxima?.id && !citaTerminada(c, ahoraMs))
    .sort((a, b) => ms(a.inicio) - ms(b.inicio));
}

/** "Próxima, en 25 min" o "En curso, hasta las 10:50". */
export function etiquetaProxima(cita: CitaConPaciente, ahoraMs: number) {
  if (ms(cita.inicio) <= ahoraMs) return `En curso, hasta las ${horaTexto(cita.fin)}`;
  return `Próxima, ${tiempoRelativo(cita.inicio, new Date(ahoraMs))}`;
}

const ACTIVAS: EstadoCita[] = ['solicitada', 'confirmada', 'asistio', 'no_asistio'];

/** Nodos del Trazo: cobalto la próxima, tinta lo agendado, vacío lo solicitado, gris lo pasado. */
export function nodosDelDia(citas: CitaConPaciente[], ahoraMs: number): TraceNode[] {
  const visibles = citas.filter((c) => ACTIVAS.includes(c.estado));
  if (visibles.length === 0) return [];
  const proxima = proximaCita(visibles, ahoraMs);
  const inicio = Math.min(DIA_INICIO, ...visibles.map((c) => minutosDelDia(c.inicio)));
  const fin = Math.max(DIA_FIN, ...visibles.map((c) => minutosDelDia(c.inicio) + 60));
  return visibles.map((c): TraceNode => {
    const kind: TraceNode['kind'] =
      c.id === proxima?.id
        ? 'next'
        : citaTerminada(c, ahoraMs)
          ? 'past'
          : c.estado === 'solicitada'
            ? 'pending'
            : 'scheduled';
    return { at: posicionEnDia(minutosDelDia(c.inicio), inicio, fin), kind };
  });
}

export function posicionEnDia(min: number, inicio = DIA_INICIO, fin = DIA_FIN) {
  const t = (Math.min(Math.max(min, inicio), fin) - inicio) / Math.max(fin - inicio, 1);
  return CALMA_DESDE + t * (1 - CALMA_DESDE - 0.03);
}

/** "Hoy", "Mañana" o la fecha corta. */
export function diaRelativo(iso: string, hoy: string) {
  const clave = fechaClave(iso);
  if (clave === hoy) return 'Hoy';
  if (clave === sumarDias(hoy, 1)) return 'Mañana';
  return fechaCorta(iso);
}

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/* ---------- RN-06: dos inasistencias seguidas ---------- */

export type Asistencia = {
  pacienteId: string;
  nombre: string;
  telefono: string | null;
  estado: 'asistio' | 'no_asistio';
  inicio: string;
};

export type ParaContactar = {
  pacienteId: string;
  nombre: string;
  telefono: string | null;
  ultimaInasistencia: string;
};

/**
 * Pacientes cuyas dos últimas citas resueltas (asistió / no asistió) fueron inasistencias.
 * Se omiten si ya hay un seguimiento creado después de la última inasistencia
 * (alguien ya los contactó o tiene la llamada programada).
 */
export function pacientesParaContactar(asistencias: Asistencia[], ultimoSeguimiento: Map<string, string>): ParaContactar[] {
  const porPaciente = new Map<string, Asistencia[]>();
  for (const a of [...asistencias].sort((x, y) => ms(y.inicio) - ms(x.inicio))) {
    const lista = porPaciente.get(a.pacienteId) ?? [];
    if (lista.length < 2) lista.push(a);
    porPaciente.set(a.pacienteId, lista);
  }
  const resultado: ParaContactar[] = [];
  for (const [pacienteId, [ultima, penultima]] of porPaciente) {
    if (!ultima || ultima.estado !== 'no_asistio' || penultima?.estado !== 'no_asistio') continue;
    const seguimiento = ultimoSeguimiento.get(pacienteId);
    if (seguimiento && ms(seguimiento) >= ms(ultima.inicio)) continue;
    resultado.push({ pacienteId, nombre: ultima.nombre, telefono: ultima.telefono, ultimaInasistencia: ultima.inicio });
  }
  return resultado.sort((a, b) => ms(b.ultimaInasistencia) - ms(a.ultimaInasistencia));
}
