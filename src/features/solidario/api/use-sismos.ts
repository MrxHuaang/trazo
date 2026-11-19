import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import type { Sismo } from './sismo.mapper';
import { getSismosRecientes } from './sismos.api';

const QUINCE_MINUTOS = 1000 * 60 * 15;
const UN_DIA = 1000 * 60 * 60 * 24;

// Fuera de `qk` a propósito: son datos remotos públicos, no una tabla local.
export const llaveSismos = ['solidario', 'sismos'] as const;

/** Sismos cerca de Pereira (USGS), frescos por 15 minutos. */
export const useSismos = () =>
  useQuery({
    queryKey: llaveSismos,
    queryFn: getSismosRecientes,
    staleTime: QUINCE_MINUTOS,
    gcTime: UN_DIA,
    retry: 1,
  });

// Sin `response` la petición ni llegó al servidor: sin internet, DNS o timeout.
export const esFalloDeRed = (error: unknown) => isAxiosError(error) && !error.response;

const HORA = 1000 * 60 * 60;

/** "hace 12 min", "hace 5 h", "hace 3 días". */
export function haceCuanto(momento: number, ahora: number) {
  const ms = Math.max(ahora - momento, 0);
  const minutos = Math.round(ms / 60_000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(ms / HORA);
  if (horas < 48) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} días`;
}

/** Siempre con un decimal: 4,6 */
export const formatoMagnitud = (m: number) => m.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Aviso a la psicóloga: magnitud 4 o más en las últimas 48 horas. */
export const AVISO = { magnitud: 4, horas: 48 } as const;

/** El más fuerte dentro del umbral, o null. */
export function sismoDeAviso(sismos: Sismo[], ahora: number) {
  const recientes = sismos.filter((s) => s.magnitud >= AVISO.magnitud && ahora - s.momento <= AVISO.horas * HORA && s.momento <= ahora);
  if (!recientes.length) return null;
  return recientes.reduce((a, b) => (b.magnitud > a.magnitud ? b : a));
}

// Cuánto se agita el Trazo según el último sismo; llega a 1 con magnitud 6.
export function agitacionPorSismos(sismos: Sismo[]) {
  const ultimo = sismos[0];
  if (!ultimo) return 0.15;
  return Math.min(1, Math.max(0.2, (ultimo.magnitud - 2) / 4));
}
