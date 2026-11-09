/**
 * Consultas propias del módulo "Hoy" sobre las tablas compartidas (solo lectura, salvo el contacto
 * que se registra con el repositorio compartido de seguimientos).
 */
import { consultar } from '@/data/db';
import { actualizarSeguimiento, crearSeguimiento } from '@/data/repos/seguimientos';
import { hoyClave } from '@/lib/dates';

import { pacientesParaContactar, type Asistencia } from './rules';

export const MOTIVO_CONTACTO = 'Contacto tras dos inasistencias';

type FilaAsistencia = { paciente_id: string; nombre: string; telefono: string | null; estado: Asistencia['estado']; inicio: string };

/**
 * RN-06: pacientes con dos inasistencias seguidas, sin citas activas por delante
 * (si ya reagendaron, no hace falta escribirles).
 */
export async function listarParaContactar(referencia = new Date()) {
  const ahora = referencia.toISOString();
  const filas = await consultar<FilaAsistencia>(
    `SELECT c.paciente_id, p.nombre, p.telefono, c.estado, c.inicio
       FROM citas c JOIN pacientes p ON p.id = c.paciente_id
      WHERE p.archivado_en IS NULL
        AND c.estado IN ('asistio', 'no_asistio')
        AND c.inicio < ?
        AND NOT EXISTS (
          SELECT 1 FROM citas f
           WHERE f.paciente_id = c.paciente_id AND f.estado IN ('solicitada', 'confirmada') AND f.inicio >= ?
        )
      ORDER BY c.paciente_id, c.inicio DESC`,
    [ahora, ahora],
  );
  const seguimientos = await consultar<{ paciente_id: string; ultimo: string }>(
    `SELECT paciente_id, MAX(creado_en) AS ultimo FROM seguimientos WHERE paciente_id IS NOT NULL GROUP BY paciente_id`,
  );
  return pacientesParaContactar(
    filas.map((f) => ({ pacienteId: f.paciente_id, nombre: f.nombre, telefono: f.telefono, estado: f.estado, inicio: f.inicio })),
    new Map(seguimientos.map((s) => [s.paciente_id, s.ultimo])),
  );
}

/** Deja constancia del contacto como un seguimiento hecho (aparece en la historia del paciente). */
export async function registrarContacto(d: { pacienteId: string; nombre: string; telefono: string | null }) {
  const id = await crearSeguimiento({
    pacienteId: d.pacienteId,
    nombre: d.nombre,
    telefono: d.telefono,
    fechaObjetivo: hoyClave(),
    motivo: MOTIVO_CONTACTO,
  });
  await actualizarSeguimiento(id, { estado: 'hecho' });
}
