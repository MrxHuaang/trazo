// Zustand porque la bienvenida, los ajustes y el AccessGate leen el mismo estado sin pasar props.
// Arranca bloqueada: al abrir la app en frío siempre se pide desbloqueo (HU-01).
import { create } from 'zustand';

/** Tiempo en segundo plano tras el que se vuelve a pedir desbloqueo (cap. 9). */
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

// Atajos para usar la sesión fuera de React, por ejemplo desde las mutaciones.
export const abrirSesion = () => useSesion.getState().abrir();

export const cerrarSesion = () => useSesion.getState().cerrar();

export const useSesionBloqueada = () => useSesion((sesion) => sesion.bloqueada);
