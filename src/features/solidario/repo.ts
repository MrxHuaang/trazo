import { ahoraIso, bit, bool, consultar, consultarUno, db, ejecutar } from '@/data/db';
import type { Asistente, Jornada, Recurso } from '@/domain/types';
import { isoDesde } from '@/lib/dates';
import { nuevoId } from '@/lib/id';

import { mesSiguiente } from './rules';

type FilaJornada = {
  id: string; titulo: string; tipo: Jornada['tipo']; lugar: string; barrio: string | null; inicio: string; fin: string;
  cupos: number; descripcion: string | null; latitud: number | null; longitud: number | null; creado_en: string;
  inscritos: number;
};

export type JornadaConInscritos = Jornada & { inscritos: number };

const SELECT_JORNADA = `SELECT j.*, (SELECT COUNT(*) FROM asistentes a WHERE a.jornada_id = j.id) AS inscritos
  FROM jornadas j`;

const mapearJornada = (f: FilaJornada): JornadaConInscritos => ({
  id: f.id, titulo: f.titulo, tipo: f.tipo, lugar: f.lugar, barrio: f.barrio, inicio: f.inicio, fin: f.fin,
  cupos: f.cupos, descripcion: f.descripcion, latitud: f.latitud, longitud: f.longitud, creadoEn: f.creado_en,
  inscritos: f.inscritos,
});

/** Las que aún no terminan, de la más cercana a la más lejana. */
export async function listarJornadasProximas() {
  const filas = await consultar<FilaJornada>(`${SELECT_JORNADA} WHERE j.fin >= ? ORDER BY j.inicio`, [ahoraIso()]);
  return filas.map(mapearJornada);
}

/** Las que ya terminaron, la más reciente primero. */
export async function listarJornadasAnteriores(limite = 5) {
  const filas = await consultar<FilaJornada>(`${SELECT_JORNADA} WHERE j.fin < ? ORDER BY j.inicio DESC LIMIT ?`, [
    ahoraIso(),
    limite,
  ]);
  return filas.map(mapearJornada);
}

/** Todas, la más reciente primero. */
export async function listarJornadas() {
  const filas = await consultar<FilaJornada>(`${SELECT_JORNADA} ORDER BY j.inicio DESC`);
  return filas.map(mapearJornada);
}

export async function obtenerJornada(id: string) {
  const f = await consultarUno<FilaJornada>(`${SELECT_JORNADA} WHERE j.id = ?`, [id]);
  return f ? mapearJornada(f) : null;
}

export type NuevaJornada = {
  titulo: string;
  tipo: Jornada['tipo'];
  lugar: string;
  barrio?: string | null;
  inicio: string;
  fin: string;
  cupos: number;
  descripcion?: string | null;
  /** Grados decimales. */
  latitud?: number | null;
  longitud?: number | null;
};

const textoOpcional = (v?: string | null) => (v?.trim() ? v.trim() : null);

export async function crearJornada(d: NuevaJornada) {
  const id = nuevoId();
  await ejecutar(
    `INSERT INTO jornadas (id, titulo, tipo, lugar, barrio, inicio, fin, cupos, descripcion, creado_en, latitud, longitud)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, d.titulo.trim(), d.tipo, d.lugar.trim(), textoOpcional(d.barrio), d.inicio, d.fin, d.cupos,
      textoOpcional(d.descripcion), ahoraIso(), d.latitud ?? null, d.longitud ?? null],
  );
  return (await obtenerJornada(id))!;
}

export async function actualizarJornada(id: string, d: NuevaJornada) {
  await ejecutar(
    `UPDATE jornadas SET titulo=?, tipo=?, lugar=?, barrio=?, inicio=?, fin=?, cupos=?, descripcion=?, latitud=?, longitud=?
      WHERE id=?`,
    [d.titulo.trim(), d.tipo, d.lugar.trim(), textoOpcional(d.barrio), d.inicio, d.fin, d.cupos,
      textoOpcional(d.descripcion), d.latitud ?? null, d.longitud ?? null, id],
  );
  return (await obtenerJornada(id))!;
}

/** Los seguimientos se desligan antes de borrar para que la cascada del esquema no se los lleve. */
export async function eliminarJornada(id: string) {
  const base = db();
  await base.withTransactionAsync(async () => {
    await base.runAsync(
      'UPDATE seguimientos SET asistente_id = NULL WHERE asistente_id IN (SELECT id FROM asistentes WHERE jornada_id = ?)',
      [id],
    );
    await base.runAsync('DELETE FROM jornadas WHERE id = ?', [id]);
  });
}

type FilaAsistente = {
  id: string; jornada_id: string; paciente_id: string | null; nombre: string; telefono: string | null;
  requiere_seguimiento: number; consentimiento_datos: number; creado_en: string;
};

const mapearAsistente = (f: FilaAsistente): Asistente => ({
  id: f.id, jornadaId: f.jornada_id, pacienteId: f.paciente_id, nombre: f.nombre, telefono: f.telefono,
  requiereSeguimiento: bool(f.requiere_seguimiento), consentimientoDatos: bool(f.consentimiento_datos), creadoEn: f.creado_en,
});

/** El último registrado primero. */
export async function listarAsistentes(jornadaId: string) {
  const filas = await consultar<FilaAsistente>(
    'SELECT * FROM asistentes WHERE jornada_id = ? ORDER BY creado_en DESC, rowid DESC',
    [jornadaId],
  );
  return filas.map(mapearAsistente);
}

export type NuevoAsistente = {
  /** Se genera en el teléfono para que la fila optimista y la guardada tengan el mismo id. */
  id?: string;
  jornadaId: string;
  nombre: string;
  telefono?: string | null;
  requiereSeguimiento: boolean;
  consentimientoDatos: boolean;
};

/** Solo dígitos, o null si no queda nada. */
export const limpiarTelefono = (telefono?: string | null) => {
  const digitos = (telefono ?? '').replace(/\D/g, '');
  return digitos.length ? digitos : null;
};

export async function crearAsistente(d: NuevoAsistente): Promise<Asistente> {
  const id = d.id ?? nuevoId();
  const t = ahoraIso();
  await ejecutar(
    `INSERT INTO asistentes (id, jornada_id, paciente_id, nombre, telefono, requiere_seguimiento, consentimiento_datos, creado_en)
     VALUES (?,?,NULL,?,?,?,?,?)`,
    [id, d.jornadaId, d.nombre.trim(), limpiarTelefono(d.telefono), bit(d.requiereSeguimiento), bit(d.consentimientoDatos), t],
  );
  return {
    id, jornadaId: d.jornadaId, pacienteId: null, nombre: d.nombre.trim(), telefono: limpiarTelefono(d.telefono),
    requiereSeguimiento: d.requiereSeguimiento, consentimientoDatos: d.consentimientoDatos, creadoEn: t,
  };
}

/** Para registros por error: sus seguimientos se borran en cascada. */
export async function eliminarAsistente(id: string) {
  await ejecutar('DELETE FROM asistentes WHERE id = ?', [id]);
}

/** También le pasa sus seguimientos, para que la historia de la jornada quede en la ficha. */
export async function vincularPaciente(asistenteId: string, pacienteId: string) {
  const base = db();
  await base.withTransactionAsync(async () => {
    await base.runAsync('UPDATE asistentes SET paciente_id = ? WHERE id = ?', [pacienteId, asistenteId]);
    await base.runAsync('UPDATE seguimientos SET paciente_id = ? WHERE asistente_id = ? AND paciente_id IS NULL', [
      pacienteId,
      asistenteId,
    ]);
  });
}

/** Evita duplicar fichas al convertir un asistente. */
export async function buscarPacientePorTelefono(telefono?: string | null) {
  const digitos = limpiarTelefono(telefono);
  if (!digitos) return null;
  return consultarUno<{ id: string; nombre: string }>(
    'SELECT id, nombre FROM pacientes WHERE telefono = ? AND archivado_en IS NULL LIMIT 1',
    [digitos],
  );
}

export async function jornadasDePaciente(pacienteId: string) {
  const filas = await consultar<FilaJornada>(
    `${SELECT_JORNADA} WHERE j.id IN (SELECT jornada_id FROM asistentes WHERE paciente_id = ?) ORDER BY j.inicio DESC`,
    [pacienteId],
  );
  return filas.map(mapearJornada);
}

export async function listarRecursos(): Promise<Recurso[]> {
  return consultar<Recurso>('SELECT id, titulo, descripcion, telefono, whatsapp, url, orden FROM recursos ORDER BY orden, titulo');
}

// Cifras del informe de impacto (HU-23)

const rangoMes = (mes: string) => [isoDesde(`${mes}-01`), isoDesde(`${mesSiguiente(mes)}-01`)] as const;

/** Personas afectadas distintas y sesiones solidarias atendidas en el mes. */
export async function cifrasCitasMes(mes: string) {
  const [desde, hasta] = rangoMes(mes);
  const f = await consultarUno<{ personas: number; solidarias: number }>(
    `SELECT
       (SELECT COUNT(DISTINCT c.paciente_id) FROM citas c JOIN pacientes p ON p.id = c.paciente_id
         WHERE p.afectado_sismo = 1 AND c.estado = 'asistio' AND c.inicio >= ? AND c.inicio < ?) AS personas,
       (SELECT COUNT(*) FROM citas c
         WHERE c.es_solidaria = 1 AND c.estado = 'asistio' AND c.inicio >= ? AND c.inicio < ?) AS solidarias`,
    [desde, hasta, desde, hasta],
  );
  return { personasAfectadas: f?.personas ?? 0, sesionesSolidarias: f?.solidarias ?? 0 };
}

/** Citas del mes cuyo pago quedó como donado. */
export async function sesionesDonadasMes(mes: string) {
  const [desde, hasta] = rangoMes(mes);
  const f = await consultarUno<{ n: number }>(
    `SELECT COUNT(*) AS n FROM pagos g JOIN citas c ON c.id = g.cita_id
      WHERE g.estado = 'donado' AND c.inicio >= ? AND c.inicio < ?`,
    [desde, hasta],
  );
  return f?.n ?? 0;
}

export async function cifrasJornadasMes(mes: string) {
  const [desde, hasta] = rangoMes(mes);
  const f = await consultarUno<{ jornadas: number; asistentes: number }>(
    `SELECT
       (SELECT COUNT(*) FROM jornadas WHERE inicio >= ? AND inicio < ?) AS jornadas,
       (SELECT COUNT(*) FROM asistentes a JOIN jornadas j ON j.id = a.jornada_id
         WHERE j.inicio >= ? AND j.inicio < ?) AS asistentes`,
    [desde, hasta, desde, hasta],
  );
  return { jornadas: f?.jornadas ?? 0, asistentes: f?.asistentes ?? 0 };
}

/** El esquema no guarda cuándo se completó un seguimiento, así que se filtra por la fecha objetivo. */
export async function seguimientosHechosMes(mes: string) {
  const f = await consultarUno<{ n: number }>(
    `SELECT COUNT(*) AS n FROM seguimientos WHERE estado = 'hecho' AND fecha_objetivo >= ? AND fecha_objetivo < ?`,
    [`${mes}-01`, `${mesSiguiente(mes)}-01`],
  );
  return f?.n ?? 0;
}
