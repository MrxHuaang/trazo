/**
 * Reglas del ejercicio de quietud: sostener el teléfono quieto hasta juntar 30 segundos de calma.
 * Son puras y corren en el hilo de la interfaz (cuadro a cuadro), por eso llevan 'worklet'.
 */

/** Segundos seguidos de calma que completan el ejercicio. */
export const META_QUIETUD = 30;

/**
 * Energía del sismógrafo (0 a 1) por debajo de la cual el teléfono cuenta como quieto.
 * Deja pasar el pulso normal de una mano que sostiene el teléfono.
 */
export const UMBRAL_QUIETUD = 0.2;

/** Cuántos segundos de progreso se pierden por segundo de movimiento, según la energía. */
export function retroceso(energia: number) {
  'worklet';
  return 0.5 + 1.5 * Math.min(1, Math.max(0, energia));
}

/**
 * Progreso después de `dt` segundos con la energía actual: suma tiempo si está quieto y, si se mueve,
 * retrocede con suavidad (más rápido cuanto más se mueve). Siempre entre 0 y la meta.
 */
export function avanceQuietud(progreso: number, energia: number, dt: number) {
  'worklet';
  const paso = energia < UMBRAL_QUIETUD ? dt : -retroceso(energia) * dt;
  return Math.min(META_QUIETUD, Math.max(0, progreso + paso));
}
