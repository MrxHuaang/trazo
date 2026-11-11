/**
 * Reglas puras de la bandeja "Hoy" (HU-02). Reciben la hora de referencia en milisegundos
 * para que sean fáciles de probar y no dependan del reloj.
 */
import type { CitaConPaciente, EstadoCita } from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto, isoDesde, minutosDelDia, sumarDias, tiempoRelativo } from '@/lib/dates';
import { formatoCOP, nombreCorto } from '@/lib/format';
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

/** Nodo del Trazo con los datos que muestra la etiqueta al arrastrar el dedo. */
export type PuntoDia = TraceNode & { id: string; hora: string; nombre: string };

/** Nodos del Trazo: cobalto la próxima, tinta lo agendado, vacío lo solicitado, gris lo pasado. */
export function nodosDelDia(citas: CitaConPaciente[], ahoraMs: number): PuntoDia[] {
  const visibles = citas.filter((c) => ACTIVAS.includes(c.estado));
  if (visibles.length === 0) return [];
  const proxima = proximaCita(visibles, ahoraMs);
  const inicio = Math.min(DIA_INICIO, ...visibles.map((c) => minutosDelDia(c.inicio)));
  const fin = Math.max(DIA_FIN, ...visibles.map((c) => minutosDelDia(c.inicio) + 60));
  return visibles.map((c): PuntoDia => {
    const kind: TraceNode['kind'] =
      c.id === proxima?.id
        ? 'next'
        : citaTerminada(c, ahoraMs)
          ? 'past'
          : c.estado === 'solicitada'
            ? 'pending'
            : 'scheduled';
    return {
      id: c.id,
      at: posicionEnDia(minutosDelDia(c.inicio), inicio, fin),
      kind,
      hora: horaTexto(c.inicio),
      nombre: nombreCorto(c.paciente.nombre),
    };
  });
}

/** Nodo más cercano a una posición horizontal (en puntos) y su distancia. */
export function puntoMasCercano(puntos: PuntoDia[], x: number, ancho: number) {
  let mejor: PuntoDia | undefined;
  let distancia = Infinity;
  for (const p of puntos) {
    const d = Math.abs(p.at * ancho - x);
    if (d < distancia) {
      mejor = p;
      distancia = d;
    }
  }
  return mejor ? { punto: mejor, distancia } : null;
}

/** Ventana de la cuenta regresiva: el anillo empieza a vaciarse una hora antes. */
const VENTANA_MIN = 60;
/** Desde aquí el bloque pasa a cobalto: es hora de prepararse. */
const INMINENTE_MIN = 10;

export type CuentaRegresiva = {
  enCurso: boolean;
  inminente: boolean;
  /** 1 = anillo lleno, 0 = vacío. Antes de la cita mide lo que falta; en curso, lo que queda de sesión. */
  progreso: number;
  /** Cifra y unidad del centro del anillo ("25" + "min", "2" + "h"). */
  cifra: string;
  unidad: string;
};

export function cuentaRegresiva(cita: Pick<CitaConPaciente, 'inicio' | 'fin'>, ahoraMs: number): CuentaRegresiva {
  const inicio = ms(cita.inicio);
  const fin = ms(cita.fin);
  const enCurso = inicio <= ahoraMs;
  const minutos = Math.max(0, Math.ceil(((enCurso ? fin : inicio) - ahoraMs) / 60_000));
  const progreso = enCurso
    ? Math.min(1, Math.max(0, (fin - ahoraMs) / Math.max(fin - inicio, 1)))
    : Math.min(1, minutos / VENTANA_MIN);
  const enHoras = minutos >= 100;
  return {
    enCurso,
    inminente: !enCurso && minutos <= INMINENTE_MIN,
    progreso,
    cifra: enHoras ? String(Math.round(minutos / 60)) : String(minutos),
    unidad: enHoras ? 'h' : 'min',
  };
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

/* ---------- Resumen de la semana ---------- */

export type ResumenSemana = {
  atendidas: number;
  inasistencias: number;
  /** Personas afectadas por el sismo con al menos una cita atendida. */
  personasAfectadas: number;
  cobrado: number;
  porCobrar: number;
  sesionesDonadas: number;
  minutosDonados: number;
};

export const RESUMEN_VACIO: ResumenSemana = {
  atendidas: 0,
  inasistencias: 0,
  personasAfectadas: 0,
  cobrado: 0,
  porCobrar: 0,
  sesionesDonadas: 0,
  minutosDonados: 0,
};

/** Porcentaje de inasistencias sobre las citas con resultado (asistió o no asistió). */
export function porcentajeInasistencias(r: Pick<ResumenSemana, 'atendidas' | 'inasistencias'>) {
  const total = r.atendidas + r.inasistencias;
  return total === 0 ? 0 : Math.round((r.inasistencias / total) * 100);
}

/** Horas donadas con un decimal como máximo: 2, 2,5. */
export function horasDonadas(minutos: number) {
  const horas = Math.round((minutos / 60) * 10) / 10;
  return Number.isInteger(horas) ? String(horas) : horas.toFixed(1).replace('.', ',');
}

/** "lun 9 nov al dom 15 nov". */
export const rangoSemana = (lunes: string) => `${fechaCorta(isoDesde(lunes))} al ${fechaCorta(isoDesde(sumarDias(lunes, 6)))}`;

/** Frase final del resumen: lo que pasó en la semana, en una línea. */
export function fraseSemana(r: ResumenSemana) {
  if (r.atendidas === 0 && r.inasistencias === 0) return 'Aún no hay citas atendidas esta semana. El Trazo está en calma.';
  const partes = [`Atendiste ${plural(r.atendidas, 'cita', 'citas')}`];
  if (r.cobrado > 0) partes.push(`cobraste ${formatoCOP(r.cobrado)}`);
  if (r.sesionesDonadas > 0) {
    partes.push(`donaste ${horasDonadas(r.minutosDonados)} ${horasDonadas(r.minutosDonados) === '1' ? 'hora' : 'horas'} de tu tiempo`);
  }
  const ultima = partes.pop();
  const texto = partes.length > 0 ? `${partes.join(', ')} y ${ultima}` : ultima;
  return `${texto}.`;
}
