/**
 * Reglas puras de la agenda: huecos de 30 min, disponibilidad, bloqueos y acomodo de bloques.
 * Los minutos se cuentan desde la medianoche en hora de Colombia (RN-02).
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

import type { Bloqueo, CitaConPaciente, Disponibilidad, Modalidad } from '@/domain/types';
import { diaSemana, enZona, fechaLarga, horaTexto, isoDesde, sumarDias } from '@/lib/dates';
import { rellenarPlantilla } from '@/lib/whatsapp';

export const PASO_MIN = 30;
export const VENTANA_INICIO = 7 * 60;
export const VENTANA_FIN = 20 * 60;
export const DURACIONES = [30, 45, 50, 60, 90];

const MS_MIN = 60_000;
const pad = (n: number) => String(n).padStart(2, '0');

export type Rango = { ini: number; fin: number };

export const aMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const aHora = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export const seCruzan = (a: Rango, b: Rango) => a.ini < b.fin && b.ini < a.fin;

/** Cita que todavía ocupa el horario (RN-01). */
export const esActiva = (c: Pick<CitaConPaciente, 'estado'>) => c.estado === 'solicitada' || c.estado === 'confirmada';

/** Parte de un intervalo ISO que cae dentro del día `dia`, en minutos del día. */
export function rangoEnDia(dia: string, inicioIso: string, finIso: string): Rango | null {
  const base = new Date(isoDesde(dia)).getTime();
  const finDia = new Date(isoDesde(sumarDias(dia, 1))).getTime();
  const a = Math.max(new Date(inicioIso).getTime(), base);
  const b = Math.min(new Date(finIso).getTime(), finDia);
  if (b <= a) return null;
  return { ini: Math.round((a - base) / MS_MIN), fin: Math.round((b - base) / MS_MIN) };
}

/* ---------- Semana y fechas ---------- */

export const diasDesde = (desde: string, n: number) => Array.from({ length: n }, (_, i) => sumarDias(desde, i));

/** 'Noviembre' a partir de una fecha clave. */
export function mesTitulo(clave: string) {
  const t = format(enZona(isoDesde(clave)), 'MMMM', { locale: es });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const diaAbreviado = (clave: string) => format(enZona(isoDesde(clave)), 'EEE', { locale: es }).replace('.', '');

export const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** 'Lunes 16 de noviembre' */
export const fechaTitulo = (clave: string) => capitalizar(fechaLarga(isoDesde(clave)));

export const NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/* ---------- Disponibilidad y bloqueos ---------- */

export type FranjaDia = Rango & { modalidad: Modalidad };

export function franjasDelDia(franjas: Disponibilidad[], dia: string): FranjaDia[] {
  const n = diaSemana(dia);
  return franjas
    .filter((f) => f.diaSemana === n)
    .map((f) => ({ ini: aMinutos(f.horaInicio), fin: aMinutos(f.horaFin), modalidad: f.modalidad }))
    .sort((a, b) => a.ini - b.ini);
}

export type BloqueoDia = Rango & { id: string; motivo: string | null };

export function bloqueosDelDia(bloqueos: Bloqueo[], dia: string): BloqueoDia[] {
  const res: BloqueoDia[] = [];
  for (const b of bloqueos) {
    const r = rangoEnDia(dia, b.inicio, b.fin);
    if (r) res.push({ ...r, id: b.id, motivo: b.motivo });
  }
  return res.sort((a, b) => a.ini - b.ini);
}

/** Texto corto de las franjas del día: '08:00 a 12:00 y 14:00 a 18:00'. */
export function resumenFranjas(franjas: FranjaDia[]) {
  const partes = franjas.map((f) => `${aHora(f.ini)} a ${aHora(f.fin)}`);
  if (partes.length <= 1) return partes.join('');
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

/** Modalidad de la franja que contiene el minuto, si existe. */
export const modalidadEn = (franjas: FranjaDia[], min: number) =>
  franjas.find((f) => f.ini <= min && min < f.fin)?.modalidad;

/* ---------- Citas en el día ---------- */

export type CitaEnDia = Rango & { cita: CitaConPaciente };

export function citasEnDia(citas: CitaConPaciente[], dia: string): CitaEnDia[] {
  const res: CitaEnDia[] = [];
  for (const c of citas) {
    const r = rangoEnDia(dia, c.inicio, c.fin);
    if (r) res.push({ ...r, cita: c });
  }
  return res.sort((a, b) => a.ini - b.ini);
}

/** Ventana visible: 7:00 a 20:00, ampliada por horas completas si algo queda por fuera. */
export function ventanaDelDia(rangos: Rango[]): Rango {
  let ini = VENTANA_INICIO;
  let fin = VENTANA_FIN;
  for (const r of rangos) {
    ini = Math.min(ini, Math.floor(r.ini / 60) * 60);
    fin = Math.max(fin, Math.ceil(r.fin / 60) * 60);
  }
  return { ini: Math.max(0, ini), fin: Math.min(24 * 60, fin) };
}

export type EstadoHueco = 'libre' | 'fuera' | 'bloqueado' | 'ocupado' | 'pasado';

/**
 * Huecos de 30 min de la ventana. Sin ninguna franja configurada, todo el día cuenta como disponible
 * (la agenda no queda inútil antes de definir la disponibilidad).
 */
export function huecosDelDia(p: {
  dia: string;
  ventana: Rango;
  franjas: FranjaDia[];
  sinDisponibilidad: boolean;
  bloqueos: BloqueoDia[];
  citas: CitaEnDia[];
  ahoraMs: number;
}): { ini: number; estado: EstadoHueco }[] {
  const base = new Date(isoDesde(p.dia)).getTime();
  const res: { ini: number; estado: EstadoHueco }[] = [];
  for (let ini = p.ventana.ini; ini < p.ventana.fin; ini += PASO_MIN) {
    const r = { ini, fin: ini + PASO_MIN };
    let estado: EstadoHueco = 'libre';
    if (p.bloqueos.some((b) => seCruzan(b, r))) estado = 'bloqueado';
    else if (!p.sinDisponibilidad && !p.franjas.some((f) => f.ini <= r.ini && r.fin <= f.fin)) estado = 'fuera';
    else if (p.citas.some((c) => seCruzan(c, r))) estado = 'ocupado';
    else if (base + ini * MS_MIN < p.ahoraMs) estado = 'pasado';
    res.push({ ini, estado });
  }
  return res;
}

/** Rangos contiguos de huecos con el mismo estado (para sombrear de una vez). */
export function agruparHuecos(huecos: { ini: number; estado: EstadoHueco }[], estado: EstadoHueco): Rango[] {
  const res: Rango[] = [];
  for (const h of huecos) {
    if (h.estado !== estado) continue;
    const ultimo = res[res.length - 1];
    if (ultimo && ultimo.fin === h.ini) ultimo.fin = h.ini + PASO_MIN;
    else res.push({ ini: h.ini, fin: h.ini + PASO_MIN });
  }
  return res;
}

export type OpcionHora = { hora: string; estado: 'libre' | 'ocupada' | 'bloqueada' };

/**
 * Horas de inicio posibles para una cita de `duracion` minutos en el día (cada 30 min).
 * Por defecto solo dentro de la disponibilidad; con `todas`, de 7:00 a 20:00.
 */
export function horasParaCita(p: {
  dia: string;
  franjas: FranjaDia[];
  sinDisponibilidad: boolean;
  todas: boolean;
  bloqueos: BloqueoDia[];
  citas: CitaEnDia[];
  duracion: number;
  ahoraMs: number;
  excluirCitaId?: string;
}): OpcionHora[] {
  const inicios = new Set<number>();
  if (p.todas || p.sinDisponibilidad) {
    for (let m = VENTANA_INICIO; m + p.duracion <= VENTANA_FIN; m += PASO_MIN) inicios.add(m);
  } else {
    for (const f of p.franjas) {
      for (let m = f.ini; m + p.duracion <= f.fin; m += PASO_MIN) inicios.add(m);
    }
  }
  const base = new Date(isoDesde(p.dia)).getTime();
  const activas = p.citas.filter((c) => esActiva(c.cita) && c.cita.id !== p.excluirCitaId);
  return [...inicios]
    .filter((m) => base + m * MS_MIN >= p.ahoraMs)
    .sort((a, b) => a - b)
    .map((m) => {
      const r = { ini: m, fin: m + p.duracion };
      const estado: OpcionHora['estado'] = p.bloqueos.some((b) => seCruzan(b, r))
        ? 'bloqueada'
        : activas.some((c) => seCruzan(c, r))
          ? 'ocupada'
          : 'libre';
      return { hora: aHora(m), estado };
    });
}

/** Primer hueco libre para una cita de `duracion` minutos, buscando día por día desde `desde`. */
export function primerHuecoLibre(p: {
  desde: string;
  dias: number;
  franjas: Disponibilidad[];
  bloqueos: Bloqueo[];
  citas: CitaConPaciente[];
  duracion: number;
  ahoraMs: number;
}): { dia: string; ini: number } | null {
  const sinDisponibilidad = p.franjas.length === 0;
  for (const dia of diasDesde(p.desde, p.dias)) {
    const libre = horasParaCita({
      dia,
      franjas: franjasDelDia(p.franjas, dia),
      sinDisponibilidad,
      todas: false,
      bloqueos: bloqueosDelDia(p.bloqueos, dia),
      citas: citasEnDia(p.citas, dia),
      duracion: p.duracion,
      ahoraMs: p.ahoraMs,
    }).find((h) => h.estado === 'libre');
    if (libre) return { dia, ini: aMinutos(libre.hora) };
  }
  return null;
}

/** Paso del arrastre para reprogramar: 15 minutos. */
export const PASO_ARRASTRE = 15;

/**
 * Valida soltar una cita en un nuevo rango del mismo día (RN-01 antes de tocar la base de datos).
 * Devuelve el motivo en palabras cuando no se puede.
 */
export function validarMovimiento(p: {
  dia: string;
  rango: Rango;
  citaId: string;
  citas: CitaEnDia[];
  bloqueos: BloqueoDia[];
  ahoraMs: number;
}): { ok: true } | { ok: false; motivo: string } {
  const base = new Date(isoDesde(p.dia)).getTime();
  if (base + p.rango.ini * MS_MIN < p.ahoraMs) return { ok: false, motivo: 'Esa hora ya pasó.' };
  const choque = p.citas.find((c) => c.cita.id !== p.citaId && esActiva(c.cita) && seCruzan(c, p.rango));
  if (choque) {
    return { ok: false, motivo: `Se cruza con la cita de ${primerNombre(choque.cita.paciente.nombre)} a las ${aHora(choque.ini)}.` };
  }
  const bloqueo = p.bloqueos.find((b) => seCruzan(b, p.rango));
  if (bloqueo) return { ok: false, motivo: bloqueo.motivo ? `Esa hora está bloqueada: ${bloqueo.motivo}.` : 'Esa hora está bloqueada.' };
  return { ok: true };
}

/** Acomoda bloques que se cruzan en columnas (casi nunca pasa: RN-01 lo impide entre citas activas). */
export function distribuirColumnas<T extends Rango>(items: T[]): (T & { col: number; cols: number })[] {
  const orden = [...items].sort((a, b) => a.ini - b.ini || b.fin - a.fin);
  const res: (T & { col: number; cols: number })[] = [];
  let grupo: (T & { col: number; cols: number })[] = [];
  let finGrupo = -1;
  const cerrar = () => {
    const cols = Math.max(1, ...grupo.map((g) => g.col + 1));
    for (const g of grupo) g.cols = cols;
    res.push(...grupo);
    grupo = [];
  };
  for (const it of orden) {
    if (grupo.length && it.ini >= finGrupo) cerrar();
    const ocupadas = new Set(grupo.filter((g) => g.fin > it.ini).map((g) => g.col));
    let col = 0;
    while (ocupadas.has(col)) col++;
    grupo.push({ ...it, col, cols: 1 });
    finGrupo = Math.max(finGrupo, it.fin);
  }
  if (grupo.length) cerrar();
  return res;
}

/* ---------- Presentación de una cita ---------- */

export const ETIQUETA_ESTADO: Record<CitaConPaciente['estado'], string> = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  asistio: 'Asistió',
  no_asistio: 'No asistió',
  cancelada: 'Cancelada',
};

export const ETIQUETA_MODALIDAD: Record<Modalidad, string> = { presencial: 'Presencial', virtual: 'Virtual' };

export const MODALIDADES: { valor: Modalidad; etiqueta: string }[] = [
  { valor: 'presencial', etiqueta: 'Presencial' },
  { valor: 'virtual', etiqueta: 'Virtual' },
];

export const duracionMin = (c: Pick<CitaConPaciente, 'inicio' | 'fin'>) =>
  Math.round((new Date(c.fin).getTime() - new Date(c.inicio).getTime()) / MS_MIN);

export const rangoHoras = (c: Pick<CitaConPaciente, 'inicio' | 'fin'>) => `${horaTexto(c.inicio)} a ${horaTexto(c.fin)}`;

/** Paciente con tarifa social o gratuita, o afectado por el sismo: cupo solidario por defecto. */
export const sugiereSolidaria = (p: { afectadoSismo: boolean; tarifa: string }) => p.afectadoSismo || p.tarifa !== 'normal';

function primerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

/** Mensaje de WhatsApp a partir de una plantilla del consultorio ({nombre}, {fecha}, {hora}, {modalidad}, {enlace}). */
export function mensajeCita(plantilla: string, cita: CitaConPaciente) {
  return rellenarPlantilla(plantilla, {
    nombre: primerNombre(cita.paciente.nombre),
    fecha: fechaLarga(cita.inicio),
    hora: horaTexto(cita.inicio),
    modalidad: cita.modalidad,
    enlace: cita.modalidad === 'virtual' && cita.enlace ? cita.enlace : '',
  })
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,?])/g, '$1')
    .trim();
}

/** Asegura el protocolo del enlace de videollamada. */
export function normalizarEnlace(texto: string) {
  const t = texto.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
