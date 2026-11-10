/**
 * Repositorio del módulo agenda: disponibilidad semanal y bloqueos (HU-13).
 * Usa las tablas `disponibilidad` y `bloqueos` del esquema compartido.
 */
import { consultar, consultarUno, ejecutar } from '@/data/db';
import type { Bloqueo, Disponibilidad, Modalidad } from '@/domain/types';
import { nuevoId } from '@/lib/id';

/* ---------- Disponibilidad ---------- */

type FilaFranja = { id: string; dia_semana: number; hora_inicio: string; hora_fin: string; modalidad: Modalidad };

const mapearFranja = (f: FilaFranja): Disponibilidad => ({
  id: f.id,
  diaSemana: f.dia_semana,
  horaInicio: f.hora_inicio,
  horaFin: f.hora_fin,
  modalidad: f.modalidad,
});

export class ErrorFranja extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorFranja';
  }
}

export type NuevaFranja = Omit<Disponibilidad, 'id'>;

export async function listarDisponibilidad(): Promise<Disponibilidad[]> {
  const filas = await consultar<FilaFranja>('SELECT * FROM disponibilidad ORDER BY dia_semana, hora_inicio');
  return filas.map(mapearFranja);
}

/** Las horas son 'HH:mm', así que la comparación de texto respeta el orden. */
async function validarFranja(d: NuevaFranja, excluirId = '') {
  if (d.horaFin <= d.horaInicio) throw new ErrorFranja('La hora de fin debe ser posterior a la de inicio.');
  const cruce = await consultarUno<{ n: number }>(
    'SELECT COUNT(*) AS n FROM disponibilidad WHERE dia_semana = ? AND hora_inicio < ? AND hora_fin > ? AND id != ?',
    [d.diaSemana, d.horaFin, d.horaInicio, excluirId],
  );
  if ((cruce?.n ?? 0) > 0) throw new ErrorFranja('Esa franja se cruza con otra del mismo día.');
}

export async function crearFranja(d: NuevaFranja): Promise<Disponibilidad> {
  await validarFranja(d);
  const id = nuevoId();
  await ejecutar('INSERT INTO disponibilidad (id, dia_semana, hora_inicio, hora_fin, modalidad) VALUES (?,?,?,?,?)', [
    id, d.diaSemana, d.horaInicio, d.horaFin, d.modalidad,
  ]);
  return { id, ...d };
}

export async function actualizarFranja(id: string, d: NuevaFranja): Promise<Disponibilidad> {
  await validarFranja(d, id);
  await ejecutar('UPDATE disponibilidad SET dia_semana = ?, hora_inicio = ?, hora_fin = ?, modalidad = ? WHERE id = ?', [
    d.diaSemana, d.horaInicio, d.horaFin, d.modalidad, id,
  ]);
  return { id, ...d };
}

export async function borrarFranja(id: string) {
  await ejecutar('DELETE FROM disponibilidad WHERE id = ?', [id]);
}

/* ---------- Bloqueos ---------- */

type FilaBloqueo = { id: string; inicio: string; fin: string; motivo: string | null };

const mapearBloqueo = (f: FilaBloqueo): Bloqueo => ({ id: f.id, inicio: f.inicio, fin: f.fin, motivo: f.motivo });

export type NuevoBloqueo = Omit<Bloqueo, 'id'>;

/** Bloqueos que aún no terminan en la fecha de referencia (ISO), ordenados por inicio. */
export async function listarBloqueosVigentes(desde: string): Promise<Bloqueo[]> {
  const filas = await consultar<FilaBloqueo>('SELECT * FROM bloqueos WHERE fin > ? ORDER BY inicio', [desde]);
  return filas.map(mapearBloqueo);
}

/** Bloqueos que se cruzan con [desde, hasta). */
export async function listarBloqueosEntre(desde: string, hasta: string): Promise<Bloqueo[]> {
  const filas = await consultar<FilaBloqueo>('SELECT * FROM bloqueos WHERE inicio < ? AND fin > ? ORDER BY inicio', [
    hasta, desde,
  ]);
  return filas.map(mapearBloqueo);
}

function validarBloqueo(d: NuevoBloqueo) {
  if (d.fin <= d.inicio) throw new ErrorFranja('El bloqueo debe terminar después de empezar.');
}

export async function crearBloqueo(d: NuevoBloqueo): Promise<Bloqueo> {
  validarBloqueo(d);
  const id = nuevoId();
  await ejecutar('INSERT INTO bloqueos (id, inicio, fin, motivo) VALUES (?,?,?,?)', [id, d.inicio, d.fin, d.motivo]);
  return { id, ...d };
}

export async function actualizarBloqueo(id: string, d: NuevoBloqueo): Promise<Bloqueo> {
  validarBloqueo(d);
  await ejecutar('UPDATE bloqueos SET inicio = ?, fin = ?, motivo = ? WHERE id = ?', [d.inicio, d.fin, d.motivo, id]);
  return { id, ...d };
}

export async function borrarBloqueo(id: string) {
  await ejecutar('DELETE FROM bloqueos WHERE id = ?', [id]);
}
