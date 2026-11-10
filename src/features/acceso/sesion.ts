/**
 * Estado de la sesión local: si Trazo está abierto o bloqueado en este momento.
 * Vive fuera de React para que la bienvenida, los ajustes y el AccessGate compartan la misma fuente
 * sin pasar props. La sesión arranca cerrada: al abrir la app en frío se pide desbloqueo (HU-01).
 */
import { useSyncExternalStore } from 'react';

/** Minutos en segundo plano tras los cuales Trazo vuelve a pedir desbloqueo (capítulo 9). */
export const MINUTOS_PARA_BLOQUEAR = 2;

let bloqueada = true;
const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

const leer = () => bloqueada;

/** Marca la sesión como abierta (desbloqueo correcto, consultorio recién creado, bloqueo recién activado). */
export function abrirSesion() {
  if (!bloqueada) return;
  bloqueada = false;
  avisar();
}

/** Cierra la sesión: la próxima vez que se muestre la app se pedirá desbloqueo si el bloqueo está activo. */
export function cerrarSesion() {
  if (bloqueada) return;
  bloqueada = true;
  avisar();
}

export function useSesionBloqueada() {
  return useSyncExternalStore(suscribir, leer, leer);
}
