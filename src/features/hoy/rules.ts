import type { TraceNode } from '@/ui';

import type { CitaDemo } from '../demo/demo-data';

/** Ventana del día que representa el Trazo en "Hoy". */
const DIA_INICIO = 7 * 60;
const DIA_FIN = 19 * 60;
/** El Trazo está agitado hasta este punto; las citas se dibujan en la parte en calma. */
const CALMA_DESDE = 0.3;

const activa = (c: CitaDemo) => c.estado === 'confirmada' || c.estado === 'solicitada';

/** Primera cita confirmada que aún no termina. */
export function proximaCita(citas: CitaDemo[], ahoraMin: number) {
  return citas
    .filter((c) => c.estado === 'confirmada' && c.inicioMin + c.duracionMin > ahoraMin)
    .sort((a, b) => a.inicioMin - b.inicioMin)[0];
}

/** Citas activas posteriores a la próxima, en orden. */
export function siguientesCitas(citas: CitaDemo[], ahoraMin: number) {
  const proxima = proximaCita(citas, ahoraMin);
  return citas
    .filter((c) => activa(c) && c.id !== proxima?.id && c.inicioMin + c.duracionMin > ahoraMin)
    .sort((a, b) => a.inicioMin - b.inicioMin);
}

/** Nodos del Trazo: cobalto la próxima, tinta lo agendado, vacío lo solicitado, gris lo pasado. */
export function nodosDelDia(citas: CitaDemo[], ahoraMin: number): TraceNode[] {
  const proxima = proximaCita(citas, ahoraMin);
  return citas
    .filter((c) => c.estado !== 'cancelada')
    .map((c): TraceNode => {
      const kind: TraceNode['kind'] =
        c.id === proxima?.id
          ? 'next'
          : c.inicioMin + c.duracionMin <= ahoraMin
            ? 'past'
            : c.estado === 'solicitada'
              ? 'pending'
              : 'scheduled';
      return { at: posicionEnDia(c.inicioMin), kind };
    });
}

export function posicionEnDia(min: number) {
  const t = (Math.min(Math.max(min, DIA_INICIO), DIA_FIN) - DIA_INICIO) / (DIA_FIN - DIA_INICIO);
  return CALMA_DESDE + t * (1 - CALMA_DESDE - 0.03);
}

export function horaTexto(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "en 25 min", "en 2 h", "ahora". */
export function tiempoHasta(inicioMin: number, ahoraMin: number) {
  const diff = inicioMin - ahoraMin;
  if (diff <= 0) return 'ahora';
  if (diff < 60) return `en ${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m === 0 ? `en ${h} h` : `en ${h} h ${m} min`;
}

export function formatoCOP(valor: number) {
  return `$${Math.round(valor).toLocaleString('es-CO')}`;
}
