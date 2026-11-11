/**
 * Acciones de ubicación y permisos con expo-location (mismo esquema de la clase de mapas:
 * acciones puras aquí, estado en stores de Zustand).
 */
import * as Location from 'expo-location';
import { Linking } from 'react-native';

export type LatLng = { latitud: number; longitud: number };

/**
 * comprobando: aún no se consulta · sin_preguntar: nunca se ha pedido · concedido ·
 * denegado: dijo que no, se puede volver a pedir · bloqueado: solo se cambia en Ajustes.
 */
export type EstadoPermiso = 'comprobando' | 'sin_preguntar' | 'concedido' | 'denegado' | 'bloqueado';

const aEstado = (r: Location.LocationPermissionResponse): EstadoPermiso => {
  if (r.granted) return 'concedido';
  if (r.status === Location.PermissionStatus.UNDETERMINED) return 'sin_preguntar';
  return r.canAskAgain ? 'denegado' : 'bloqueado';
};

/** Consulta el permiso sin mostrar el diálogo del sistema. */
export const comprobarPermisoUbicacion = async () => aEstado(await Location.getForegroundPermissionsAsync());

/** Muestra el diálogo del sistema (solo mientras la app está abierta). */
export const pedirPermisoUbicacion = async () => aEstado(await Location.requestForegroundPermissionsAsync());

/** Ubicación actual. Usa la última conocida si es reciente para responder rápido. */
export const obtenerUbicacionActual = async (): Promise<LatLng> => {
  const ultima = await Location.getLastKnownPositionAsync({ maxAge: 60_000 }).catch(() => null);
  const { coords } = ultima ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return { latitud: coords.latitude, longitud: coords.longitude };
};

/** Abre los ajustes de la app para cambiar el permiso a mano. */
export const abrirAjustesDelSistema = () => Linking.openSettings();
