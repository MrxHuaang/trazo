import { useEffect, type RefObject } from 'react';
import { AppState } from 'react-native';

import { usePermisosStore } from '../store/use-permisos-store';
import { useUbicacionStore } from '../store/use-ubicacion-store';
import type { MapaLeafletHandle } from './mapa-leaflet';

/**
 * Ubicación propia en el mapa. Al abrir solo consulta el permiso (sin diálogo): si ya está
 * concedido pinta el punto; si no, el mapa sigue funcionando y el permiso se pide cuando la
 * persona toca "Mi ubicación" o el aviso. Al volver de Ajustes se vuelve a consultar.
 */
export function useMiUbicacion(mapa: RefObject<MapaLeafletHandle | null>, listo: boolean) {
  const permiso = usePermisosStore((s) => s.ubicacion);
  const comprobar = usePermisosStore((s) => s.comprobarUbicacion);
  const pedir = usePermisosStore((s) => s.pedirUbicacion);
  const ultima = useUbicacionStore((s) => s.ultima);
  const buscando = useUbicacionStore((s) => s.buscando);
  const fallo = useUbicacionStore((s) => s.fallo);
  const obtener = useUbicacionStore((s) => s.obtener);

  useEffect(() => {
    const revisar = () =>
      void comprobar().then((estado) => {
        if (estado === 'concedido') void obtener();
      });
    revisar();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') revisar();
    });
    return () => suscripcion.remove();
  }, [comprobar, obtener]);

  useEffect(() => {
    if (listo && ultima) mapa.current?.setUsuario(ultima);
  }, [listo, ultima, mapa]);

  /** Pide el permiso si hace falta y centra el mapa en la ubicación propia. */
  const irAMiUbicacion = async () => {
    const estado = permiso === 'concedido' ? permiso : await pedir();
    if (estado !== 'concedido') return;
    const punto = await obtener();
    if (punto) mapa.current?.moverA(punto, 15);
  };

  return { permiso, ultima, buscando, fallo, irAMiUbicacion };
}
