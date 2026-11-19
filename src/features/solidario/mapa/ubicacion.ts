// Como en la clase de mapas: aquí solo llamadas a expo-location, el estado vive en Zustand.
import * as Location from 'expo-location';
import { Linking } from 'react-native';

export type LatLng = { latitud: number; longitud: number };

/** `denegado` todavía se puede volver a pedir; `bloqueado` solo se cambia desde Ajustes. */
export type EstadoPermiso = 'comprobando' | 'sin_preguntar' | 'concedido' | 'denegado' | 'bloqueado';

const aEstado = (r: Location.LocationPermissionResponse): EstadoPermiso => {
  if (r.granted) return 'concedido';
  if (r.status === Location.PermissionStatus.UNDETERMINED) return 'sin_preguntar';
  return r.canAskAgain ? 'denegado' : 'bloqueado';
};

/** No muestra el diálogo del sistema. */
export const comprobarPermisoUbicacion = async () => aEstado(await Location.getForegroundPermissionsAsync());

export const pedirPermisoUbicacion = async () => aEstado(await Location.requestForegroundPermissionsAsync());

// Si hay una posición de hace menos de un minuto se usa esa: pedir una nueva tarda bastante más.
export const obtenerUbicacionActual = async (): Promise<LatLng> => {
  const ultima = await Location.getLastKnownPositionAsync({ maxAge: 60_000 }).catch(() => null);
  const { coords } = ultima ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return { latitud: coords.latitude, longitud: coords.longitude };
};

export const abrirAjustesDelSistema = () => Linking.openSettings();
