import type { Consultorio } from '@/domain/types';
import { nuevoId } from '@/lib/id';

import { ahoraIso, bit, bool, consultarUno, ejecutar } from '../db';

type Fila = {
  id: string; nombre: string; profesional: string; correo: string | null; tarifa_base: number;
  tarifa_social: number; duracion_cita: number; cupos_solidarios_semana: number;
  plantilla_recordatorio: string; plantilla_confirmacion: string; bloqueo_activo: number; creado_en: string;
};

const mapear = (f: Fila): Consultorio => ({
  id: f.id, nombre: f.nombre, profesional: f.profesional, correo: f.correo, tarifaBase: f.tarifa_base,
  tarifaSocial: f.tarifa_social, duracionCita: f.duracion_cita, cuposSolidariosSemana: f.cupos_solidarios_semana,
  plantillaRecordatorio: f.plantilla_recordatorio, plantillaConfirmacion: f.plantilla_confirmacion,
  bloqueoActivo: bool(f.bloqueo_activo), creadoEn: f.creado_en,
});

export const PLANTILLA_RECORDATORIO =
  'Hola {nombre}, te recuerdo tu cita {modalidad} del {fecha} a las {hora}. ¿Me confirmas tu asistencia? {enlace}';
export const PLANTILLA_CONFIRMACION =
  'Hola {nombre}, tu cita quedó confirmada para el {fecha} a las {hora} ({modalidad}). {enlace}';

export async function obtenerConsultorio(): Promise<Consultorio | null> {
  const f = await consultarUno<Fila>('SELECT * FROM consultorio LIMIT 1');
  return f ? mapear(f) : null;
}

export type NuevoConsultorio = Pick<Consultorio, 'nombre' | 'profesional'> & Partial<Consultorio>;

export async function crearConsultorio(d: NuevoConsultorio): Promise<Consultorio> {
  const id = nuevoId();
  await ejecutar(
    `INSERT INTO consultorio (id, nombre, profesional, correo, tarifa_base, tarifa_social, duracion_cita,
      cupos_solidarios_semana, plantilla_recordatorio, plantilla_confirmacion, bloqueo_activo, creado_en)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, d.nombre, d.profesional, d.correo ?? null, d.tarifaBase ?? 70000, d.tarifaSocial ?? 35000,
      d.duracionCita ?? 50, d.cuposSolidariosSemana ?? 3, d.plantillaRecordatorio ?? PLANTILLA_RECORDATORIO,
      d.plantillaConfirmacion ?? PLANTILLA_CONFIRMACION, bit(d.bloqueoActivo ?? true), ahoraIso()],
  );
  return (await obtenerConsultorio())!;
}

export async function actualizarConsultorio(cambios: Partial<Omit<Consultorio, 'id' | 'creadoEn'>>) {
  const actual = await obtenerConsultorio();
  if (!actual) throw new Error('No hay consultorio creado.');
  const c = { ...actual, ...cambios };
  await ejecutar(
    `UPDATE consultorio SET nombre=?, profesional=?, correo=?, tarifa_base=?, tarifa_social=?, duracion_cita=?,
      cupos_solidarios_semana=?, plantilla_recordatorio=?, plantilla_confirmacion=?, bloqueo_activo=? WHERE id=?`,
    [c.nombre, c.profesional, c.correo, c.tarifaBase, c.tarifaSocial, c.duracionCita, c.cuposSolidariosSemana,
      c.plantillaRecordatorio, c.plantillaConfirmacion, bit(c.bloqueoActivo), c.id],
  );
  return (await obtenerConsultorio())!;
}
