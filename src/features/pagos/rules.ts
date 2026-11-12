/** Reglas puras de Pagos (HU-10, HU-16, HU-24). */
import type { ResumenMes } from '@/data/repos/pagos';
import { METODOS_PAGO, type EstadoPago, type MetodoPago, type PagoConCita } from '@/domain/types';
import { fechaClave, mesTexto } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';

/** Suma meses a una clave 'yyyy-MM'. */
export function sumarMeses(mes: string, n: number) {
  const [y = 1970, m = 1] = mes.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** "noviembre" si es del año de referencia; "diciembre de 2025" si no. */
export function nombreMes(mes: string, mesReferencia: string) {
  const texto = mesTexto(mes);
  return mes.slice(0, 4) === mesReferencia.slice(0, 4) ? texto.replace(/ de \d{4}$/, '') : texto;
}

const sesiones = (n: number) => `${n} ${n === 1 ? 'sesión' : 'sesiones'}`;

/** Frase de resumen del mes (HU-16), en pasado si el mes ya terminó. */
export function fraseResumen(r: ResumenMes, mes: string, mesActual: string, hayPagos: boolean) {
  const nombre = nombreMes(mes, mesActual);
  const actual = mes === mesActual;
  if (!hayPagos) {
    return actual ? `Aún no hay sesiones atendidas en ${nombre}.` : `No hubo sesiones atendidas en ${nombre}.`;
  }
  const cobrado = `cobraste ${formatoCOP(r.cobrado)}`;
  const pendiente =
    r.pendiente > 0
      ? `${actual ? 'tienes' : 'quedaron'} ${formatoCOP(r.pendiente)} por cobrar`
      : 'no quedan pagos pendientes';
  const donado = r.sesionesDonadas > 0 ? `donaste ${sesiones(r.sesionesDonadas)}` : 'no hubo sesiones donadas';
  return `En ${nombre} ${cobrado}, ${pendiente} y ${donado}.`;
}

export const etiquetaMetodo = (metodo: MetodoPago | null) =>
  METODOS_PAGO.find((m) => m.valor === metodo)?.etiqueta ?? 'Sin método';

export const ETIQUETA_ESTADO: Record<EstadoPago, string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  donado: 'Donado',
};

export type DiaDePagos = { clave: string; inicio: string; pagos: PagoConCita[] };

/** Agrupa por día de la cita (hora de Colombia), en el orden en que aparece cada día. */
export function agruparPorDia(pagos: PagoConCita[]): DiaDePagos[] {
  const dias = new Map<string, DiaDePagos>();
  for (const p of pagos) {
    const clave = fechaClave(p.citaInicio);
    const dia = dias.get(clave);
    if (dia) dia.pagos.push(p);
    else dias.set(clave, { clave, inicio: p.citaInicio, pagos: [p] });
  }
  return [...dias.values()];
}

export const contar = (pagos: PagoConCita[], estado: EstadoPago) => pagos.filter((p) => p.estado === estado).length;
