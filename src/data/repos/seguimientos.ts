import type { EstadoSeguimiento, Seguimiento } from '@/domain/types';
import { nuevoId } from '@/lib/id';

import { ahoraIso, consultar, ejecutar } from '../db';

type Fila = {
  id: string; paciente_id: string | null; asistente_id: string | null; nombre: string; telefono: string | null;
  fecha_objetivo: string; motivo: string; estado: EstadoSeguimiento; nota: string | null; creado_en: string;
};

const mapear = (f: Fila): Seguimiento => ({
  id: f.id, pacienteId: f.paciente_id, asistenteId: f.asistente_id, nombre: f.nombre, telefono: f.telefono,
  fechaObjetivo: f.fecha_objetivo, motivo: f.motivo, estado: f.estado, nota: f.nota, creadoEn: f.creado_en,
});

export type FiltroSeguimientos = { estado?: EstadoSeguimiento; hasta?: string; pacienteId?: string };

/** `hasta` = fechaClave inclusiva (p. ej. hoy → vencidos y de hoy). */
export async function listarSeguimientos(f: FiltroSeguimientos = {}) {
  const where: string[] = [];
  const params: string[] = [];
  if (f.estado) { where.push('estado = ?'); params.push(f.estado); }
  if (f.hasta) { where.push('fecha_objetivo <= ?'); params.push(f.hasta); }
  if (f.pacienteId) { where.push('paciente_id = ?'); params.push(f.pacienteId); }
  const filas = await consultar<Fila>(
    `SELECT * FROM seguimientos ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY fecha_objetivo`,
    params,
  );
  return filas.map(mapear);
}

export type NuevoSeguimiento = {
  nombre: string;
  telefono?: string | null;
  fechaObjetivo: string;
  motivo: string;
  pacienteId?: string | null;
  asistenteId?: string | null;
};

export async function crearSeguimiento(d: NuevoSeguimiento) {
  const id = nuevoId();
  await ejecutar(
    `INSERT INTO seguimientos (id, paciente_id, asistente_id, nombre, telefono, fecha_objetivo, motivo, estado, nota, creado_en)
     VALUES (?,?,?,?,?,?,?, 'pendiente', NULL, ?)`,
    [id, d.pacienteId ?? null, d.asistenteId ?? null, d.nombre, d.telefono ?? null, d.fechaObjetivo, d.motivo, ahoraIso()],
  );
  return id;
}

export async function actualizarSeguimiento(id: string, cambios: { estado?: EstadoSeguimiento; nota?: string | null; fechaObjetivo?: string }) {
  const sets: string[] = [];
  const params: (string | null)[] = [];
  if (cambios.estado) { sets.push('estado = ?'); params.push(cambios.estado); }
  if (cambios.nota !== undefined) { sets.push('nota = ?'); params.push(cambios.nota); }
  if (cambios.fechaObjetivo) { sets.push('fecha_objetivo = ?'); params.push(cambios.fechaObjetivo); }
  if (!sets.length) return;
  await ejecutar(`UPDATE seguimientos SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
}
