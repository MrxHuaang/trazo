/**
 * Repositorio del módulo pacientes para sus tablas propias (notas_sesion, consentimientos)
 * y una lectura agregada de citas para la lista.
 * Las notas se listan SIN contenido: el texto solo se lee al desbloquear la nota (HU-12).
 */
import { ahoraIso, consultar, consultarUno, ejecutar } from '@/data/db';
import type { Consentimiento, NotaSesion } from '@/domain/types';
import { nuevoId } from '@/lib/id';

import { VERSION_AUTORIZACION } from './rules';

/* ---------- Notas de sesión ---------- */

/** Nota sin su contenido: lo único que ven la ficha y la historia. */
export type NotaResumen = Omit<NotaSesion, 'contenido'>;

type FilaNotaResumen = { id: string; paciente_id: string; cita_id: string | null; creado_en: string; actualizado_en: string };

const mapearNotaResumen = (f: FilaNotaResumen): NotaResumen => ({
  id: f.id, pacienteId: f.paciente_id, citaId: f.cita_id, creadoEn: f.creado_en, actualizadoEn: f.actualizado_en,
});

const COLUMNAS_RESUMEN = 'id, paciente_id, cita_id, creado_en, actualizado_en';

export async function listarNotasPaciente(pacienteId: string): Promise<NotaResumen[]> {
  const filas = await consultar<FilaNotaResumen>(
    `SELECT ${COLUMNAS_RESUMEN} FROM notas_sesion WHERE paciente_id = ? ORDER BY creado_en DESC`,
    [pacienteId],
  );
  return filas.map(mapearNotaResumen);
}

/** Contexto de una nota antes de desbloquearla: a qué paciente y sesión pertenece, sin contenido. */
export type ContextoNota = {
  notaId: string | null;
  pacienteId: string | null;
  pacienteNombre: string | null;
  citaId: string | null;
  /** Fecha de la sesión (inicio de la cita) o de creación de la nota. */
  fecha: string | null;
};

/**
 * `id` puede ser el id de una cita (así la abre el detalle de cita), el id de una nota
 * sin cita (así la abre la historia) o `nueva` con `pacienteId`.
 */
export async function contextoNota(id: string, pacienteId?: string): Promise<ContextoNota> {
  const vacio: ContextoNota = { notaId: null, pacienteId: null, pacienteNombre: null, citaId: null, fecha: null };
  if (id === 'nueva') {
    if (!pacienteId) return vacio;
    const p = await consultarUno<{ nombre: string }>('SELECT nombre FROM pacientes WHERE id = ?', [pacienteId]);
    return p ? { ...vacio, pacienteId, pacienteNombre: p.nombre } : vacio;
  }

  const cita = await consultarUno<{ id: string; paciente_id: string; inicio: string; nombre: string }>(
    'SELECT c.id, c.paciente_id, c.inicio, p.nombre FROM citas c JOIN pacientes p ON p.id = c.paciente_id WHERE c.id = ?',
    [id],
  );
  if (cita) {
    const nota = await consultarUno<{ id: string }>(
      'SELECT id FROM notas_sesion WHERE cita_id = ? ORDER BY creado_en LIMIT 1',
      [cita.id],
    );
    return { notaId: nota?.id ?? null, pacienteId: cita.paciente_id, pacienteNombre: cita.nombre, citaId: cita.id, fecha: cita.inicio };
  }

  const nota = await consultarUno<FilaNotaResumen & { nombre: string }>(
    `SELECT n.id, n.paciente_id, n.cita_id, n.creado_en, n.actualizado_en, p.nombre
       FROM notas_sesion n JOIN pacientes p ON p.id = n.paciente_id WHERE n.id = ?`,
    [id],
  );
  if (nota) {
    return { notaId: nota.id, pacienteId: nota.paciente_id, pacienteNombre: nota.nombre, citaId: nota.cita_id, fecha: nota.creado_en };
  }
  return vacio;
}

/** Solo se llama con la nota desbloqueada. */
export async function obtenerContenidoNota(id: string): Promise<string> {
  const f = await consultarUno<{ contenido: string }>('SELECT contenido FROM notas_sesion WHERE id = ?', [id]);
  return f?.contenido ?? '';
}

export type GuardarNota = { notaId?: string | null; pacienteId: string; citaId?: string | null; contenido: string };

/** Crea o actualiza la nota y devuelve su id. */
export async function guardarNota(d: GuardarNota): Promise<string> {
  const t = ahoraIso();
  if (d.notaId) {
    await ejecutar('UPDATE notas_sesion SET contenido = ?, actualizado_en = ? WHERE id = ?', [d.contenido, t, d.notaId]);
    return d.notaId;
  }
  const id = nuevoId();
  await ejecutar(
    'INSERT INTO notas_sesion (id, paciente_id, cita_id, contenido, creado_en, actualizado_en) VALUES (?,?,?,?,?,?)',
    [id, d.pacienteId, d.citaId ?? null, d.contenido, t, t],
  );
  return id;
}

/* ---------- Consentimientos (HU-11) ---------- */

type FilaConsentimiento = {
  id: string; paciente_id: string; tipo: Consentimiento['tipo']; version_texto: string; aceptado_en: string; revocado_en: string | null;
};

const mapearConsentimiento = (f: FilaConsentimiento): Consentimiento => ({
  id: f.id, pacienteId: f.paciente_id, tipo: f.tipo, versionTexto: f.version_texto, aceptadoEn: f.aceptado_en, revocadoEn: f.revocado_en,
});

export async function listarConsentimientos(pacienteId: string): Promise<Consentimiento[]> {
  const filas = await consultar<FilaConsentimiento>(
    'SELECT * FROM consentimientos WHERE paciente_id = ? ORDER BY aceptado_en DESC',
    [pacienteId],
  );
  return filas.map(mapearConsentimiento);
}

export async function registrarConsentimiento(pacienteId: string, tipo: Consentimiento['tipo'] = 'datos_personales') {
  await ejecutar(
    'INSERT INTO consentimientos (id, paciente_id, tipo, version_texto, aceptado_en) VALUES (?,?,?,?,?)',
    [nuevoId(), pacienteId, tipo, VERSION_AUTORIZACION, ahoraIso()],
  );
}

/* ---------- Resumen de citas para la lista ---------- */

export type ResumenCitas = { proxima: string | null; ultima: string | null };

/** Próxima cita activa y última cita (no cancelada) de cada paciente. */
export async function resumenCitasPacientes(referencia = ahoraIso()): Promise<Record<string, ResumenCitas>> {
  const filas = await consultar<{ paciente_id: string; proxima: string | null; ultima: string | null }>(
    `SELECT paciente_id,
        MIN(CASE WHEN inicio >= ? AND estado IN ('solicitada','confirmada') THEN inicio END) AS proxima,
        MAX(CASE WHEN inicio < ? AND estado != 'cancelada' THEN inicio END) AS ultima
       FROM citas GROUP BY paciente_id`,
    [referencia, referencia],
  );
  const mapa: Record<string, ResumenCitas> = {};
  for (const f of filas) mapa[f.paciente_id] = { proxima: f.proxima, ultima: f.ultima };
  return mapa;
}
