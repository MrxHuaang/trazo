// Reglas puras de Hoy (HU-02). Reciben la hora en ms en vez de leer el reloj, para poder probarlas.
import type { CitaConPaciente, EstadoCita } from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto, isoDesde, minutosDelDia, sumarDias, tiempoRelativo } from '@/lib/dates';
import { formatoCOP, nombreCorto } from '@/lib/format';
import type { TraceNode } from '@/ui';

// Ventana mínima del Trazo en minutos; se amplía si hay citas por fuera.
const DIA_INICIO = 7 * 60;
const DIA_FIN = 19 * 60;
// Hasta aquí el Trazo va agitado; las citas se dibujan en la parte en calma.
const CALMA_DESDE = 0.3;

const ms = (iso: string) => new Date(iso).getTime();

/** Si ya se registró la asistencia cuenta como terminada aunque no haya llegado la hora de fin. */
export const citaTerminada = (c: CitaConPaciente, ahoraMs: number) =>
  ms(c.fin) <= ahoraMs || c.estado === 'asistio' || c.estado === 'no_asistio';

/** Puede devolver una cita que ya está en curso. */
export function proximaCita(citas: CitaConPaciente[], ahoraMs: number) {
  return citas
    .filter((c) => c.estado === 'confirmada' && !citaTerminada(c, ahoraMs))
    .sort((a, b) => ms(a.inicio) - ms(b.inicio))[0];
}

/** Solo confirmadas: las solicitadas tienen su propia sección. */
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

/** hora y nombre son lo que muestra la etiqueta al arrastrar el dedo. */
export type PuntoDia = TraceNode & { id: string; hora: string; nombre: string };

export function nodosDelDia(citas: CitaConPaciente[], ahoraMs: number): PuntoDia[] {
  const visibles = citas.filter((c) => ACTIVAS.includes(c.estado));
  if (visibles.length === 0) return [];
  const proxima = proximaCita(visibles, ahoraMs);
  const inicio = Math.min(DIA_INICIO, ...visibles.map((c) => minutosDelDia(c.inicio)));
  // El +60 deja espacio para que la última cita del día quepa completa.
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

/** x y ancho van en puntos de pantalla; `at` de cada nodo está normalizado de 0 a 1. */
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

// El anillo empieza a vaciarse una hora antes de la cita.
const VENTANA_MIN = 60;
// Desde aquí el bloque pasa a cobalto.
const INMINENTE_MIN = 10;

export type CuentaRegresiva = {
  enCurso: boolean;
  inminente: boolean;
  /** 1 lleno, 0 vacío. Antes de la cita mide lo que falta; en curso, lo que queda de sesión. */
  progreso: number;
  /** Centro del anillo, p. ej. 25 min o 2 h. */
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
  // Tres cifras no caben en el anillo; desde 100 min se muestra en horas.
  const enHoras = minutos >= 100;
  return {
    enCurso,
    inminente: !enCurso && minutos <= INMINENTE_MIN,
    progreso,
    cifra: enHoras ? String(Math.round(minutos / 60)) : String(minutos),
    unidad: enHoras ? 'h' : 'min',
  };
}

/** Ubica un minuto en la parte en calma; el 0.03 final evita que el último nodo quede cortado. */
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

// RN-06: dos inasistencias seguidas

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

/** Si ya hay un seguimiento posterior a la última inasistencia, alguien se está encargando y se omite. */
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

// Resumen de la semana

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

/** Sobre las citas con resultado, no sobre todas las agendadas. */
export function porcentajeInasistencias(r: Pick<ResumenSemana, 'atendidas' | 'inasistencias'>) {
  const total = r.atendidas + r.inasistencias;
  return total === 0 ? 0 : Math.round((r.inasistencias / total) * 100);
}

/** Máximo un decimal y con coma: 2 o 2,5. */
export function horasDonadas(minutos: number) {
  const horas = Math.round((minutos / 60) * 10) / 10;
  return Number.isInteger(horas) ? String(horas) : horas.toFixed(1).replace('.', ',');
}

/** Ej.: lun 9 nov al dom 15 nov. */
export const rangoSemana = (lunes: string) => `${fechaCorta(isoDesde(lunes))} al ${fechaCorta(isoDesde(sumarDias(lunes, 6)))}`;

/** La última parte se une con "y" para que se lea como una frase natural. */
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
