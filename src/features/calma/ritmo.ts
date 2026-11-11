/**
 * Ritmo de la respiración guiada 4-4-6: inhalar 4 segundos, sostener 4 y exhalar 6.
 * Reglas puras: las usan el reloj (texto, cuenta, hápticos) y el Trazo (altura de la línea).
 */

export const INHALA = 4;
export const SOSTEN = 4;
export const EXHALA = 6;
export const CICLO = INHALA + SOSTEN + EXHALA;
export const CICLOS = 5;
export const TOTAL = CICLO * CICLOS;

export type Fase = 'inhala' | 'sosten' | 'exhala';

export const NOMBRE_FASE: Record<Fase, string> = { inhala: 'Inhala', sosten: 'Sostén', exhala: 'Exhala' };
export const DURACION_FASE: Record<Fase, number> = { inhala: INHALA, sosten: SOSTEN, exhala: EXHALA };

/** En qué va el ejercicio a los `segundo` segundos enteros de haber empezado. */
export function momento(segundo: number): { ciclo: number; fase: Fase; cuenta: number } {
  const s = Math.min(Math.max(0, Math.floor(segundo)), TOTAL - 1);
  const ciclo = Math.floor(s / CICLO);
  const enCiclo = s % CICLO;
  if (enCiclo < INHALA) return { ciclo, fase: 'inhala', cuenta: enCiclo + 1 };
  if (enCiclo < INHALA + SOSTEN) return { ciclo, fase: 'sosten', cuenta: enCiclo - INHALA + 1 };
  return { ciclo, fase: 'exhala', cuenta: enCiclo - INHALA - SOSTEN + 1 };
}

/**
 * Altura de la línea (0 = aire afuera, 1 = pulmones llenos) en el instante `t`, en segundos.
 * Antes de empezar y al terminar los cinco ciclos vale 0: el Trazo queda plano.
 */
export function nivelRespiracion(t: number) {
  'worklet';
  if (t < 0 || t >= TOTAL) return 0;
  const c = t % CICLO;
  if (c < INHALA) return 0.5 - 0.5 * Math.cos((Math.PI * c) / INHALA);
  if (c < INHALA + SOSTEN) return 1;
  return 0.5 + 0.5 * Math.cos((Math.PI * (c - INHALA - SOSTEN)) / EXHALA);
}
