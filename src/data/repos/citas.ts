import { ErrorSolape, type Cita, type CitaConPaciente, type EstadoCita, type Modalidad, type Tarifa } from '@/domain/types';
import { inicioSemana, isoDesde, sumarDias, fechaClave } from '@/lib/dates';
import { nuevoId } from '@/lib/id';

import { ahoraIso, bit, bool, consultar, consultarUno, db, ejecutar } from '../db';
import { obtenerConsultorio } from './consultorio';

type Fila = {
  id: string; paciente_id: string; inicio: string; fin: string; estado: EstadoCita; modalidad: Modalidad;
  enlace: string | null; motivo: string | null; es_solidaria: number; origen: 'app' | 'web';
  recordada_en: string | null; creado_en: string; actualizado_en: string;
  p_nombre: string; p_telefono: string | null; p_tarifa: Tarifa; p_afectado: number;
};

const SELECT = `SELECT c.*, p.nombre AS p_nombre, p.telefono AS p_telefono, p.tarifa AS p_tarifa,
  p.afectado_sismo AS p_afectado FROM citas c JOIN pacientes p ON p.id = c.paciente_id`;

const mapear = (f: Fila): CitaConPaciente => ({
  id: f.id, pacienteId: f.paciente_id, inicio: f.inicio, fin: f.fin, estado: f.estado, modalidad: f.modalidad,
  enlace: f.enlace, motivo: f.motivo, esSolidaria: bool(f.es_solidaria), origen: f.origen,
  recordadaEn: f.recordada_en, creadoEn: f.creado_en, actualizadoEn: f.actualizado_en,
  paciente: { id: f.paciente_id, nombre: f.p_nombre, telefono: f.p_telefono, tarifa: f.p_tarifa, afectadoSismo: bool(f.p_afectado) },
});

/** Citas cuyo inicio está en [desde, hasta). Por defecto excluye canceladas. */
export async function listarCitasEntre(desde: string, hasta: string, incluirCanceladas = false) {
  const filas = await consultar<Fila>(
    `${SELECT} WHERE c.inicio >= ? AND c.inicio < ? ${incluirCanceladas ? '' : "AND c.estado != 'cancelada'"} ORDER BY c.inicio`,
    [desde, hasta],
  );
  return filas.map(mapear);
}

/** Citas de un día de Colombia ('yyyy-MM-dd'). */
export const listarCitasDelDia = (clave: string) => listarCitasEntre(isoDesde(clave), isoDesde(sumarDias(clave, 1)));

export async function listarCitasPaciente(pacienteId: string) {
  const filas = await consultar<Fila>(`${SELECT} WHERE c.paciente_id = ? ORDER BY c.inicio DESC`, [pacienteId]);
  return filas.map(mapear);
}

export async function obtenerCita(id: string) {
  const f = await consultarUno<Fila>(`${SELECT} WHERE c.id = ?`, [id]);
  return f ? mapear(f) : null;
}

/** RN-01: dos citas activas no pueden solaparse. */
export async function haySolape(inicio: string, fin: string, excluirId?: string) {
  const f = await consultarUno<{ n: number }>(
    `SELECT COUNT(*) AS n FROM citas WHERE estado IN ('solicitada','confirmada') AND inicio < ? AND fin > ? AND id != ?`,
    [fin, inicio, excluirId ?? ''],
  );
  return (f?.n ?? 0) > 0;
}

export type NuevaCita = {
  pacienteId: string;
  inicio: string;
  fin: string;
  modalidad?: Modalidad;
  estado?: EstadoCita;
  enlace?: string | null;
  motivo?: string | null;
  esSolidaria?: boolean;
  origen?: 'app' | 'web';
};

export async function crearCita(d: NuevaCita): Promise<CitaConPaciente> {
  const estado = d.estado ?? 'confirmada';
  if ((estado === 'confirmada' || estado === 'solicitada') && (await haySolape(d.inicio, d.fin))) throw new ErrorSolape();
  const id = nuevoId();
  const t = ahoraIso();
  await ejecutar(
    `INSERT INTO citas (id, paciente_id, inicio, fin, estado, modalidad, enlace, motivo, es_solidaria, origen,
      recordada_en, creado_en, actualizado_en) VALUES (?,?,?,?,?,?,?,?,?,?,NULL,?,?)`,
    [id, d.pacienteId, d.inicio, d.fin, estado, d.modalidad ?? 'presencial', d.enlace ?? null, d.motivo ?? null,
      bit(d.esSolidaria ?? false), d.origen ?? 'app', t, t],
  );
  return (await obtenerCita(id))!;
}

export async function actualizarCita(id: string, cambios: Partial<Omit<Cita, 'id' | 'creadoEn' | 'actualizadoEn'>>) {
  const actual = await obtenerCita(id);
  if (!actual) throw new Error('Cita no encontrada.');
  const c = { ...actual, ...cambios };
  const activa = c.estado === 'confirmada' || c.estado === 'solicitada';
  if (activa && (cambios.inicio || cambios.fin || cambios.estado) && (await haySolape(c.inicio, c.fin, id))) {
    throw new ErrorSolape();
  }
  await ejecutar(
    `UPDATE citas SET paciente_id=?, inicio=?, fin=?, estado=?, modalidad=?, enlace=?, motivo=?, es_solidaria=?,
      recordada_en=?, actualizado_en=? WHERE id=?`,
    [c.pacienteId, c.inicio, c.fin, c.estado, c.modalidad, c.enlace, c.motivo, bit(c.esSolidaria), c.recordadaEn, ahoraIso(), id],
  );
  return (await obtenerCita(id))!;
}

/**
 * Cambia el estado. RN-05: al marcar "asistió" se crea el pago según la tarifa del paciente
 * (gratuita o cita solidaria gratuita → donado, no deuda).
 */
export async function cambiarEstadoCita(id: string, estado: EstadoCita) {
  const cita = await actualizarCita(id, { estado });
  if (estado === 'asistio') {
    const existe = await consultarUno<{ id: string }>('SELECT id FROM pagos WHERE cita_id = ?', [id]);
    if (!existe) {
      const cons = await obtenerConsultorio();
      const tarifa = cita.paciente.tarifa;
      const monto = tarifa === 'gratuita' ? 0 : tarifa === 'social' ? (cons?.tarifaSocial ?? 0) : (cons?.tarifaBase ?? 0);
      await ejecutar(
        `INSERT INTO pagos (id, cita_id, paciente_id, monto, metodo, estado, pagado_en, creado_en) VALUES (?,?,?,?,NULL,?,NULL,?)`,
        [nuevoId(), id, cita.pacienteId, monto, monto === 0 ? 'donado' : 'pendiente', ahoraIso()],
      );
    }
  }
  return cita;
}

export async function marcarRecordada(id: string) {
  await ejecutar('UPDATE citas SET recordada_en = ?, actualizado_en = ? WHERE id = ?', [ahoraIso(), ahoraIso(), id]);
}

/** RN-04: confirmadas que empiezan en las próximas 24 h y aún no se han recordado. */
export async function citasPorConfirmar(referencia = new Date()) {
  const desde = referencia.toISOString();
  const hasta = new Date(referencia.getTime() + 24 * 3600 * 1000).toISOString();
  const filas = await consultar<Fila>(
    `${SELECT} WHERE c.estado = 'confirmada' AND c.recordada_en IS NULL AND c.inicio >= ? AND c.inicio < ? ORDER BY c.inicio`,
    [desde, hasta],
  );
  return filas.map(mapear);
}

/** Solicitudes (p. ej. web) pendientes de confirmar. */
export async function citasSolicitadas() {
  const filas = await consultar<Fila>(`${SELECT} WHERE c.estado = 'solicitada' AND c.inicio >= ? ORDER BY c.inicio`, [ahoraIso()]);
  return filas.map(mapear);
}

/** RN-03: citas solidarias activas o atendidas en la semana (lunes a domingo) de la fecha. */
export async function contarSolidariasSemana(clave = fechaClave()) {
  const lunes = inicioSemana(clave);
  const f = await consultarUno<{ n: number }>(
    `SELECT COUNT(*) AS n FROM citas WHERE es_solidaria = 1 AND estado IN ('solicitada','confirmada','asistio')
      AND inicio >= ? AND inicio < ?`,
    [isoDesde(lunes), isoDesde(sumarDias(lunes, 7))],
  );
  return f?.n ?? 0;
}

export async function eliminarCita(id: string) {
  await db().runAsync('DELETE FROM citas WHERE id = ?', [id]);
}
