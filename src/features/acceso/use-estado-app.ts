import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

/** Cualquier otro valor del sistema (unknown, extension) se trata como active. */
export type EstadoApp = 'active' | 'inactive' | 'background';

function suscribir(oyente: () => void) {
  const sub = AppState.addEventListener('change', oyente);
  return () => sub.remove();
}

function leer(): EstadoApp {
  const estado = AppState.currentState;
  return estado === 'background' || estado === 'inactive' ? estado : 'active';
}

const leerEnServidor = (): EstadoApp => 'active';

/** useSyncExternalStore para no perder un cambio que llegue entre el render y la suscripción. */
export function useEstadoApp() {
  return useSyncExternalStore(suscribir, leer, leerEnServidor);
}

/** inactive también cuenta: en iOS es el selector de apps o el centro de control. */
export const appOculta = (estado: EstadoApp) => estado !== 'active';
