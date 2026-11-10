/**
 * Reglas puras del programa solidario (sin React ni base de datos): cupos (RN-03),
 * seguimientos (RN-08), fechas y horas de jornadas, textos para compartir.
 */
import type { Jornada, Recurso, Seguimiento } from '@/domain/types';
import { diasEntre, fechaClave, fechaCorta, isoDesde, sumarDias } from '@/lib/dates';
import { formatoTelefono } from '@/lib/format';

export const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

export const primerNombre = (nombre?: string | null) => (nombre ?? '').trim().split(/\s+/)[0] ?? '';

/* ---------- Meses ---------- */

/** 'yyyy-MM' del mes siguiente. */
export const mesSiguiente = (mes: string) => sumarDias(`${mes}-01`, 32).slice(0, 7);
/** 'yyyy-MM' del mes anterior. */
export const mesAnterior = (mes: string) => sumarDias(`${mes}-01`, -1).slice(0, 7);

/* ---------- Cupos solidarios (RN-03) ---------- */

export type EstadoCupos = { usados: number; total: number; restantes: number; excedidos: number; detalle: string };

/** Cupos de la semana (lunes a domingo): cuántos quedan o cuántos se pasaron. */
export function estadoCupos(usados: number, total: number): EstadoCupos {
  const restantes = Math.max(total - usados, 0);
  const excedidos = Math.max(usados - total, 0);
  let detalle: string;
  if (total === 0) detalle = usados ? plural(usados, '1 cita solidaria sin cupo definido.', `${usados} citas solidarias sin cupo definido.`) : 'Aún no defines cupos semanales.';
  else if (excedidos > 0) detalle = plural(excedidos, '1 cita por encima de lo previsto.', `${excedidos} citas por encima de lo previsto.`);
  else if (restantes === 0) detalle = 'Cupos completos esta semana.';
  else detalle = plural(restantes, 'Queda 1 cupo libre.', `Quedan ${restantes} cupos libres.`);
  return { usados, total, restantes, excedidos, detalle };
}

/* ---------- Seguimientos (RN-08) ---------- */

/** Días hasta el seguimiento de un asistente o hasta el siguiente al posponer. */
export const DIAS_SEGUIMIENTO = 7;

/** RN-08: 7 días después de hoy, o de la jornada si todavía no ocurre. */
export function fechaSeguimientoAsistente(jornadaInicio: string, hoy: string) {
  const dia = fechaClave(jornadaInicio);
  return sumarDias(dia > hoy ? dia : hoy, DIAS_SEGUIMIENTO);
}

/** Posponer 7 días desde la fecha objetivo, o desde hoy si ya pasó. */
export function fechaPospuesta(fechaObjetivo: string, hoy: string) {
  return sumarDias(fechaObjetivo > hoy ? fechaObjetivo : hoy, DIAS_SEGUIMIENTO);
}

export const motivoSeguimientoJornada = (titulo: string) => `Después de la jornada «${titulo.trim()}»`;

export type ClaveGrupo = 'vencidos' | 'hoy' | 'proximos' | 'hechos';

export const GRUPOS: { clave: ClaveGrupo; titulo: string }[] = [
  { clave: 'vencidos', titulo: 'Vencidos' },
  { clave: 'hoy', titulo: 'Hoy' },
  { clave: 'proximos', titulo: 'Próximos' },
  { clave: 'hechos', titulo: 'Hechos' },
];

const porFecha = (a: Seguimiento, b: Seguimiento) => a.fechaObjetivo.localeCompare(b.fechaObjetivo);

/** Agrupa en Vencidos · Hoy · Próximos (de lo más urgente a lo más lejano) y Hechos (lo más reciente primero). */
export function agruparSeguimientos(lista: Seguimiento[], hoy: string): Record<ClaveGrupo, Seguimiento[]> {
  const grupos: Record<ClaveGrupo, Seguimiento[]> = { vencidos: [], hoy: [], proximos: [], hechos: [] };
  for (const s of lista) {
    if (s.estado === 'hecho') grupos.hechos.push(s);
    else if (s.estado !== 'pendiente') continue;
    else if (s.fechaObjetivo < hoy) grupos.vencidos.push(s);
    else if (s.fechaObjetivo === hoy) grupos.hoy.push(s);
    else grupos.proximos.push(s);
  }
  grupos.vencidos.sort(porFecha);
  grupos.proximos.sort(porFecha);
  grupos.hechos.sort((a, b) => porFecha(b, a));
  return grupos;
}

/** Los pendientes más urgentes (los vencidos más antiguos primero). */
export const masUrgentes = (lista: Seguimiento[], n = 3) =>
  lista.filter((s) => s.estado === 'pendiente').sort(porFecha).slice(0, n);

/** 'jue' a partir de 'yyyy-MM-dd'. */
export const diaCorto = (clave: string) => fechaCorta(isoDesde(clave)).split(' ')[0] ?? '';
/** '12 nov' a partir de 'yyyy-MM-dd'. */
export const diaMes = (clave: string) => fechaCorta(isoDesde(clave)).split(' ').slice(1).join(' ');

/** 'hoy', 'mañana', 'ayer', 'jue' (en los próximos días) o '12 nov'. */
export function etiquetaDia(clave: string, hoy: string) {
  const d = diasEntre(hoy, clave);
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  if (d === -1) return 'ayer';
  if (d > 1 && d < 7) return diaCorto(clave);
  return diaMes(clave);
}

/** Línea secundaria de un seguimiento. */
export function detalleSeguimiento(s: Seguimiento, hoy: string) {
  if (s.estado === 'hecho') return s.nota ? `Hecho · ${s.nota}` : 'Hecho';
  if (s.fechaObjetivo < hoy) return `Pendiente desde el ${diaMes(s.fechaObjetivo)} · ${s.motivo}`;
  return s.motivo;
}

/** Mensaje de WhatsApp para retomar contacto, sin motivos ni datos sensibles. */
export function mensajeSeguimiento(nombre: string, profesional?: string | null) {
  const quien = primerNombre(profesional);
  return `Hola ${primerNombre(nombre)}, ${quien ? `soy ${quien}. ` : ''}Te escribo para saber cómo sigues. Si quieres, podemos hablar esta semana.`;
}

/* ---------- Jornadas: tipos, fechas y horas ---------- */

export const TIPOS_JORNADA: { valor: Jornada['tipo']; etiqueta: string }[] = [
  { valor: 'taller', etiqueta: 'Taller' },
  { valor: 'charla', etiqueta: 'Charla' },
  { valor: 'atencion_grupal', etiqueta: 'Atención grupal' },
];

export const etiquetaTipo = (tipo: Jornada['tipo']) => TIPOS_JORNADA.find((t) => t.valor === tipo)?.etiqueta ?? 'Jornada';

export const capitalizar = (texto: string) => (texto ? texto[0]!.toUpperCase() + texto.slice(1) : texto);

/** Próximos `n` días como 'yyyy-MM-dd', empezando hoy. Incluye `extra` (p. ej. la fecha de una jornada que se edita). */
export function diasParaElegir(hoy: string, n = 30, extra?: string) {
  const dias = Array.from({ length: n }, (_, i) => sumarDias(hoy, i));
  if (extra && !dias.includes(extra)) return [extra, ...dias].sort();
  return dias;
}

export const aMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const aHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Franjas 'HH:mm' cada `paso` minutos, ambos extremos incluidos. */
export function franjas(desde: string, hasta: string, paso = 30) {
  const lista: string[] = [];
  for (let m = aMinutos(desde); m <= aMinutos(hasta); m += paso) lista.push(aHora(m));
  return lista;
}

export const HORA_PRIMERA = '06:00';
export const HORA_ULTIMA = '22:00';
export const HORAS_INICIO = franjas(HORA_PRIMERA, '21:30');
export const horasFin = (inicio: string) => franjas(aHora(aMinutos(inicio) + 30), HORA_ULTIMA);

/** Al mover la hora de inicio se conserva la duración, sin pasar de la última franja. */
export function finConservandoDuracion(inicioNuevo: string, inicioPrevio: string, finPrevio: string) {
  const duracion = Math.max(aMinutos(finPrevio) - aMinutos(inicioPrevio), 30);
  return aHora(Math.min(aMinutos(inicioNuevo) + duracion, aMinutos(HORA_ULTIMA)));
}

/* ---------- Líneas de ayuda ---------- */

export function textoRecurso(r: Recurso) {
  const lineas = [r.titulo];
  if (r.descripcion) lineas.push(r.descripcion);
  if (r.telefono) lineas.push(`Teléfono: ${formatoTelefono(r.telefono)}`);
  if (r.whatsapp) lineas.push(`WhatsApp: ${formatoTelefono(r.whatsapp)}`);
  if (r.url) lineas.push(r.url);
  return lineas.join('\n');
}

export function textoDirectorio(recursos: Recurso[]) {
  return ['Líneas de ayuda en salud mental', ...recursos.map(textoRecurso)].join('\n\n');
}
