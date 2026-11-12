import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

/** Estados que le importan al acceso; cualquier otro valor del sistema se trata como app visible. */
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

/** Estado de la app (active, inactive, background) leído sin perder cambios entre render y suscripción. */
export function useEstadoApp() {
  return useSyncExternalStore(suscribir, leer, leerEnServidor);
}

/** En segundo plano o inactiva (selector de apps, centro de control, diálogos del sistema). */
export const appOculta = (estado: EstadoApp) => estado !== 'active';
