/**
 * Historia del paciente (HU-09): une citas, pagos, notas, seguimientos, jornadas y consentimientos
 * en una sola línea de tiempo, de lo más reciente a lo más antiguo. Función pura.
 * Las notas nunca aportan contenido: solo "Nota privada" y la fecha (HU-12, RN-10).
 */
import {
  ESTADOS_CITA,
  METODOS_PAGO,
  type CitaConPaciente,
  type Consentimiento,
  type EstadoSeguimiento,
  type Jornada,
  type PagoConCita,
  type Seguimiento,
} from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto, hoyClave, isoDesde, sumarDias } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';

import type { NotaResumen } from './repo';

/** Cómo se dibuja el punto del ítem sobre el Trazo. */
export type NodoHistoria = 'proxima' | 'agendada' | 'solicitada' | 'pasada' | 'falta' | 'cancelada' | 'pendiente';

export type ItemHistoria = {
  clave: string;
  tipo: 'cita' | 'nota' | 'pago' | 'seguimiento' | 'jornada' | 'consentimiento';
  /** ISO para ordenar. */
  fecha: string;
  titulo: string;
  detalle: string;
  nodo: NodoHistoria;
  solidaria?: boolean;
  citaId?: string;
  /** En una cita: su nota privada, si existe. En una nota: su propio id. */
  notaId?: string | null;
  seguimientoId?: string;
  seguimientoEstado?: EstadoSeguimiento;
  jornadaId?: string;
};

type Fuentes = {
  citas: CitaConPaciente[];
  pagos: PagoConCita[];
  notas: NotaResumen[];
  seguimientos: Seguimiento[];
  consentimientos: Consentimiento[];
  /** Jornadas del programa solidario a las que asistió. */
  jornadas?: Jornada[];
  ahora?: Date;
};

/** "Hoy 11:00", "Mañana", "lun 9 nov", "jue 3 dic 2025". */
export function fechaHistoria(iso: string, conHora = false) {
  const clave = fechaClave(iso);
  const hoy = hoyClave();
  let base =
    clave === hoy ? 'Hoy' : clave === sumarDias(hoy, 1) ? 'Mañana' : clave === sumarDias(hoy, -1) ? 'Ayer' : fechaCorta(iso);
  if (clave.slice(0, 4) !== hoy.slice(0, 4)) base += ` ${clave.slice(0, 4)}`;
  return conHora ? `${base} ${horaTexto(iso)}` : base;
}

const etiquetaEstado = (estado: CitaConPaciente['estado']) =>
  ESTADOS_CITA.find((e) => e.valor === estado)?.etiqueta ?? estado;

export function textoPago(p: PagoConCita) {
  if (p.estado === 'donado') return 'pago donado';
  if (p.estado === 'pendiente') return `pago pendiente ${formatoCOP(p.monto)}`;
  const metodo = METODOS_PAGO.find((m) => m.valor === p.metodo)?.etiqueta;
  return `pagado ${formatoCOP(p.monto)}${metodo ? ` (${metodo})` : ''}`;
}

const ESTADO_SEGUIMIENTO: Record<EstadoSeguimiento, string> = {
  pendiente: 'pendiente',
  hecho: 'hecho',
  descartado: 'descartado',
};

const TIPO_JORNADA: Record<Jornada['tipo'], string> = {
  taller: 'Taller',
  charla: 'Charla',
  atencion_grupal: 'Atención grupal',
};

export function construirHistoria({ citas, pagos, notas, seguimientos, consentimientos, jornadas = [], ahora = new Date() }: Fuentes) {
  const ahoraMs = ahora.getTime();
  const pagoPorCita = new Map(pagos.map((p) => [p.citaId, p]));
  const idsCitas = new Set(citas.map((c) => c.id));
  const notaPorCita = new Map<string, string>();
  for (const n of notas) if (n.citaId && idsCitas.has(n.citaId) && !notaPorCita.has(n.citaId)) notaPorCita.set(n.citaId, n.id);

  const activa = (c: CitaConPaciente) => c.estado === 'confirmada' || c.estado === 'solicitada';
  const futura = (c: CitaConPaciente) => new Date(c.fin).getTime() > ahoraMs;
  const proxima = [...citas].filter((c) => activa(c) && futura(c)).sort((a, b) => a.inicio.localeCompare(b.inicio))[0];

  // Número de sesión en orden cronológico; las canceladas no cuentan.
  const numero = new Map<string, number>();
  let n = 0;
  for (const c of [...citas].sort((a, b) => a.inicio.localeCompare(b.inicio))) {
    if (c.estado !== 'cancelada') numero.set(c.id, ++n);
  }

  const items: ItemHistoria[] = [];

  for (const c of citas) {
    const pago = pagoPorCita.get(c.id);
    const esFutura = futura(c);
    const estado = etiquetaEstado(c.estado) + (c.estado === 'confirmada' && c.recordadaEn ? ', recordada' : '');
    const partes = [estado, c.modalidad];
    if (c.esSolidaria) partes.push('solidaria');
    if (pago) partes.push(textoPago(pago));

    let nodo: NodoHistoria = 'pasada';
    if (c.estado === 'cancelada') nodo = 'cancelada';
    else if (c.estado === 'no_asistio') nodo = 'falta';
    else if (c.id === proxima?.id) nodo = 'proxima';
    else if (activa(c) && esFutura) nodo = c.estado === 'solicitada' ? 'solicitada' : 'agendada';

    const concepto = numero.has(c.id) ? `Sesión ${numero.get(c.id)}` : 'Cita cancelada';
    items.push({
      clave: `cita-${c.id}`,
      tipo: 'cita',
      fecha: c.inicio,
      titulo: `${fechaHistoria(c.inicio, esFutura || fechaClave(c.inicio) === hoyClave())} · ${concepto}`,
      detalle: partes.join(' · '),
      nodo,
      solidaria: c.esSolidaria,
      citaId: c.id,
      notaId: notaPorCita.get(c.id) ?? null,
    });
  }

  // Pagos sin su cita en la lista (no debería pasar: cada pago tiene cita).
  for (const p of pagos) {
    if (idsCitas.has(p.citaId)) continue;
    items.push({
      clave: `pago-${p.id}`,
      tipo: 'pago',
      fecha: p.citaInicio,
      titulo: `${fechaHistoria(p.citaInicio)} · Pago`,
      detalle: textoPago(p),
      nodo: p.estado === 'pendiente' ? 'pendiente' : 'pasada',
    });
  }

  for (const nota of notas) {
    if (nota.citaId && notaPorCita.get(nota.citaId) === nota.id) continue;
    items.push({
      clave: `nota-${nota.id}`,
      tipo: 'nota',
      fecha: nota.creadoEn,
      titulo: `${fechaHistoria(nota.creadoEn)} · Nota privada`,
      detalle: 'Se abre con huella, rostro o código',
      nodo: 'pasada',
      notaId: nota.id,
    });
  }

  for (const s of seguimientos) {
    const vencido = s.estado === 'pendiente' && s.fechaObjetivo < hoyClave();
    items.push({
      clave: `seg-${s.id}`,
      tipo: 'seguimiento',
      fecha: isoDesde(s.fechaObjetivo),
      titulo: `${fechaHistoria(isoDesde(s.fechaObjetivo))} · Seguimiento`,
      detalle: `${s.motivo} · ${vencido ? 'vencido' : ESTADO_SEGUIMIENTO[s.estado]}`,
      nodo: s.estado === 'pendiente' ? 'pendiente' : s.estado === 'hecho' ? 'pasada' : 'cancelada',
      seguimientoId: s.id,
      seguimientoEstado: s.estado,
    });
  }

  for (const j of jornadas) {
    const porVenir = new Date(j.inicio).getTime() > ahoraMs;
    items.push({
      clave: `jornada-${j.id}`,
      tipo: 'jornada',
      fecha: j.inicio,
      titulo: `${fechaHistoria(j.inicio, porVenir)} · ${TIPO_JORNADA[j.tipo]}`,
      detalle: `${j.titulo} · ${j.lugar}`,
      nodo: porVenir ? 'agendada' : 'pasada',
      solidaria: true,
      jornadaId: j.id,
    });
  }

  for (const c of consentimientos) {
    const datos = c.tipo === 'datos_personales';
    const revocada = c.revocadoEn ? ` · revocada el ${fechaHistoria(c.revocadoEn)}` : '';
    items.push({
      clave: `cons-${c.id}`,
      tipo: 'consentimiento',
      fecha: c.aceptadoEn,
      titulo: `${fechaHistoria(c.aceptadoEn)} · ${datos ? 'Autorización de datos' : 'Consentimiento informado'}`,
      detalle: `${datos ? 'Ley 1581 · ' : ''}texto ${c.versionTexto}${revocada}`,
      nodo: c.revocadoEn ? 'cancelada' : 'pasada',
    });
  }

  return items.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/* ---------- Asistencia de un vistazo ---------- */

export type PuntoAsistencia = {
  id: string;
  /** sin-marcar: la cita ya pasó y nadie registró si asistió. */
  tipo: 'asistio' | 'falta' | 'cancelada' | 'futura' | 'sin-marcar';
};

export type Asistencia = {
  /** Últimas citas en orden cronológico (la más reciente al final). */
  puntos: PuntoAsistencia[];
  asistidas: number;
  faltas: number;
  canceladas: number;
  futuras: number;
  /** Asistió / (asistió + no asistió) dentro de la tira; null si aún no hay citas cumplidas. */
  porcentaje: number | null;
};

export function resumirAsistencia(citas: CitaConPaciente[], ahora = new Date(), maximo = 12): Asistencia {
  const ahoraMs = ahora.getTime();
  const puntos = [...citas]
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .slice(-maximo)
    .map((c): PuntoAsistencia => {
      if (c.estado === 'asistio') return { id: c.id, tipo: 'asistio' };
      if (c.estado === 'no_asistio') return { id: c.id, tipo: 'falta' };
      if (c.estado === 'cancelada') return { id: c.id, tipo: 'cancelada' };
      return { id: c.id, tipo: new Date(c.fin).getTime() > ahoraMs ? 'futura' : 'sin-marcar' };
    });
  const contar = (tipo: PuntoAsistencia['tipo']) => puntos.filter((p) => p.tipo === tipo).length;
  const asistidas = contar('asistio');
  const faltas = contar('falta');
  return {
    puntos,
    asistidas,
    faltas,
    canceladas: contar('cancelada'),
    futuras: contar('futura'),
    porcentaje: asistidas + faltas > 0 ? Math.round((asistidas / (asistidas + faltas)) * 100) : null,
  };
}
