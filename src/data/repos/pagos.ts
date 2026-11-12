import type { EstadoPago, MetodoPago, PagoConCita } from '@/domain/types';
import { isoDesde } from '@/lib/dates';

import { ahoraIso, consultar, consultarUno, ejecutar } from '../db';

type Fila = {
  id: string; cita_id: string; paciente_id: string; monto: number; metodo: MetodoPago | null; estado: EstadoPago;
  pagado_en: string | null; creado_en: string; cita_inicio: string; paciente_nombre: string;
};

const SELECT = `SELECT g.*, c.inicio AS cita_inicio, p.nombre AS paciente_nombre FROM pagos g
  JOIN citas c ON c.id = g.cita_id JOIN pacientes p ON p.id = g.paciente_id`;

const mapear = (f: Fila): PagoConCita => ({
  id: f.id, citaId: f.cita_id, pacienteId: f.paciente_id, monto: f.monto, metodo: f.metodo, estado: f.estado,
  pagadoEn: f.pagado_en, creadoEn: f.creado_en, citaInicio: f.cita_inicio, pacienteNombre: f.paciente_nombre,
});

const rangoMes = (mes: string) => {
  const [y, m] = mes.split('-').map(Number);
  const sig = m === 12 ? `${(y ?? 0) + 1}-01` : `${y}-${String((m ?? 0) + 1).padStart(2, '0')}`;
  return [isoDesde(`${mes}-01`), isoDesde(`${sig}-01`)] as const;
};

/** Pagos de citas del mes 'yyyy-MM'. */
export async function listarPagosMes(mes: string) {
  const [desde, hasta] = rangoMes(mes);
  const filas = await consultar<Fila>(`${SELECT} WHERE c.inicio >= ? AND c.inicio < ? ORDER BY c.inicio DESC`, [desde, hasta]);
  return filas.map(mapear);
}

export async function pagosPendientes() {
  const filas = await consultar<Fila>(`${SELECT} WHERE g.estado = 'pendiente' ORDER BY c.inicio`);
  return filas.map(mapear);
}

export async function pagosPaciente(pacienteId: string) {
  const filas = await consultar<Fila>(`${SELECT} WHERE g.paciente_id = ? ORDER BY c.inicio DESC`, [pacienteId]);
  return filas.map(mapear);
}

export async function pagoDeCita(citaId: string) {
  const f = await consultarUno<Fila>(`${SELECT} WHERE g.cita_id = ?`, [citaId]);
  return f ? mapear(f) : null;
}

export type ResumenMes = { cobrado: number; pendiente: number; donado: number; sesionesDonadas: number };

/** HU-16: cobrado, pendiente y donado (valor de referencia de la tarifa base) del mes. */
export async function resumenMes(mes: string, tarifaReferencia = 0): Promise<ResumenMes> {
  const pagos = await listarPagosMes(mes);
  const donados = pagos.filter((p) => p.estado === 'donado');
  return {
    cobrado: pagos.filter((p) => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0),
    pendiente: pagos.filter((p) => p.estado === 'pendiente').reduce((s, p) => s + p.monto, 0),
    donado: donados.length * tarifaReferencia,
    sesionesDonadas: donados.length,
  };
}

export async function registrarPago(citaId: string, metodo: MetodoPago, monto?: number) {
  const actual = await pagoDeCita(citaId);
  if (!actual) throw new Error('La cita no tiene pago pendiente.');
  await ejecutar('UPDATE pagos SET estado = ?, metodo = ?, monto = ?, pagado_en = ? WHERE cita_id = ?', [
    'pagado', metodo, monto ?? actual.monto, ahoraIso(), citaId,
  ]);
}

export async function marcarDonado(citaId: string) {
  await ejecutar("UPDATE pagos SET estado = 'donado', metodo = NULL, pagado_en = NULL WHERE cita_id = ?", [citaId]);
}
