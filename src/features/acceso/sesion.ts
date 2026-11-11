/**
 * Estado de la sesión local: si Trazo está abierto o bloqueado en este momento.
 * Es estado de interfaz, así que vive en un store de Zustand: la bienvenida, los ajustes y el
 * AccessGate comparten la misma fuente sin pasar props. La sesión arranca cerrada: al abrir la app
 * en frío se pide desbloqueo (HU-01).
 */
import { create } from 'zustand';

/** Minutos en segundo plano tras los cuales Trazo vuelve a pedir desbloqueo (capítulo 9). */
export const MINUTOS_PARA_BLOQUEAR = 2;

type Sesion = {
  bloqueada: boolean;
  abrir: () => void;
  cerrar: () => void;
};

export const useSesion = create<Sesion>((set) => ({
  bloqueada: true,
  abrir: () => set({ bloqueada: false }),
  cerrar: () => set({ bloqueada: true }),
}));

/** Marca la sesión como abierta (desbloqueo correcto, consultorio recién creado, bloqueo recién activado). */
export const abrirSesion = () => useSesion.getState().abrir();

/** Cierra la sesión: la próxima vez que se muestre la app se pedirá desbloqueo si el bloqueo está activo. */
export const cerrarSesion = () => useSesion.getState().cerrar();

export const useSesionBloqueada = () => useSesion((sesion) => sesion.bloqueada);
