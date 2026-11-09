import type { Afectacion, Paciente, Tarifa } from '@/domain/types';
import { nuevoId } from '@/lib/id';

import { ahoraIso, bit, bool, consultar, consultarUno, ejecutar } from '../db';

type Fila = {
  id: string; nombre: string; telefono: string | null; correo: string | null; fecha_nacimiento: string | null;
  tarifa: Tarifa; afectado_sismo: number; afectaciones: string; notas_generales: string | null;
  archivado_en: string | null; creado_en: string; actualizado_en: string;
};

export const mapearPaciente = (f: Fila): Paciente => ({
  id: f.id, nombre: f.nombre, telefono: f.telefono, correo: f.correo, fechaNacimiento: f.fecha_nacimiento,
  tarifa: f.tarifa, afectadoSismo: bool(f.afectado_sismo), afectaciones: JSON.parse(f.afectaciones || '[]') as Afectacion[],
  notasGenerales: f.notas_generales, archivadoEn: f.archivado_en, creadoEn: f.creado_en, actualizadoEn: f.actualizado_en,
});

export type FiltroPacientes = { busqueda?: string; incluirArchivados?: boolean; soloAfectados?: boolean };

export async function listarPacientes(filtro: FiltroPacientes = {}): Promise<Paciente[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (!filtro.incluirArchivados) where.push('archivado_en IS NULL');
  if (filtro.soloAfectados) where.push('afectado_sismo = 1');
  if (filtro.busqueda?.trim()) {
    where.push('(nombre LIKE ? OR telefono LIKE ?)');
    const q = `%${filtro.busqueda.trim()}%`;
    params.push(q, q);
  }
  const filas = await consultar<Fila>(
    `SELECT * FROM pacientes ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY nombre COLLATE NOCASE`,
    params,
  );
  return filas.map(mapearPaciente);
}

export async function obtenerPaciente(id: string): Promise<Paciente | null> {
  const f = await consultarUno<Fila>('SELECT * FROM pacientes WHERE id = ?', [id]);
  return f ? mapearPaciente(f) : null;
}

export type NuevoPaciente = {
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  fechaNacimiento?: string | null;
  tarifa?: Tarifa;
  afectadoSismo?: boolean;
  afectaciones?: Afectacion[];
  notasGenerales?: string | null;
  /** Registra la autorización de datos (Ley 1581) al crear. */
  autorizaDatos?: boolean;
};

export async function crearPaciente(d: NuevoPaciente): Promise<Paciente> {
  const id = nuevoId();
  const t = ahoraIso();
  await ejecutar(
    `INSERT INTO pacientes (id, nombre, telefono, correo, fecha_nacimiento, tarifa, afectado_sismo, afectaciones,
      notas_generales, archivado_en, creado_en, actualizado_en) VALUES (?,?,?,?,?,?,?,?,?,NULL,?,?)`,
    [id, d.nombre.trim(), d.telefono ?? null, d.correo ?? null, d.fechaNacimiento ?? null, d.tarifa ?? 'normal',
      bit(d.afectadoSismo ?? false), JSON.stringify(d.afectaciones ?? []), d.notasGenerales ?? null, t, t],
  );
  if (d.autorizaDatos) {
    await ejecutar(
      `INSERT INTO consentimientos (id, paciente_id, tipo, version_texto, aceptado_en) VALUES (?,?,?,?,?)`,
      [nuevoId(), id, 'datos_personales', 'v0.1', t],
    );
  }
  return (await obtenerPaciente(id))!;
}

export async function actualizarPaciente(id: string, cambios: Partial<NuevoPaciente>): Promise<Paciente> {
  const actual = await obtenerPaciente(id);
  if (!actual) throw new Error('Paciente no encontrado.');
  const p = { ...actual, ...cambios };
  await ejecutar(
    `UPDATE pacientes SET nombre=?, telefono=?, correo=?, fecha_nacimiento=?, tarifa=?, afectado_sismo=?,
      afectaciones=?, notas_generales=?, actualizado_en=? WHERE id=?`,
    [p.nombre.trim(), p.telefono ?? null, p.correo ?? null, p.fechaNacimiento ?? null, p.tarifa,
      bit(p.afectadoSismo), JSON.stringify(p.afectaciones), p.notasGenerales ?? null, ahoraIso(), id],
  );
  return (await obtenerPaciente(id))!;
}

/** RN-09: los pacientes no se borran, se archivan. */
export async function archivarPaciente(id: string, archivar = true) {
  await ejecutar('UPDATE pacientes SET archivado_en = ?, actualizado_en = ? WHERE id = ?', [
    archivar ? ahoraIso() : null, ahoraIso(), id,
  ]);
}
