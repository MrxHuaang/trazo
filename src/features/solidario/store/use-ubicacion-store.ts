import { create } from 'zustand';

import { obtenerUbicacionActual, type LatLng } from '../mapa/ubicacion';

type UbicacionState = {
  /** Última ubicación conocida de quien usa la app. Solo vive en memoria: no se guarda ni se envía. */
  ultima: LatLng | null;
  buscando: boolean;
  /** No se pudo obtener (GPS apagado, sin señal). */
  fallo: boolean;
  obtener: () => Promise<LatLng | null>;

  /**
   * Punto que se está eligiendo para una jornada: el formulario lo lee y el mapa en modo
   * selección lo fija. `null` = la jornada no tiene punto.
   */
  puntoJornada: LatLng | null;
  fijarPuntoJornada: (punto: LatLng | null) => void;
};

/** Ubicación propia y punto elegido en el mapa (Zustand). */
export const useUbicacionStore = create<UbicacionState>()((set) => ({
  ultima: null,
  buscando: false,
  fallo: false,

  obtener: async () => {
    set({ buscando: true, fallo: false });
    try {
      const ultima = await obtenerUbicacionActual();
      set({ ultima, buscando: false });
      return ultima;
    } catch {
      set({ buscando: false, fallo: true });
      return null;
    }
  },

  puntoJornada: null,
  fijarPuntoJornada: (punto) => set({ puntoJornada: punto }),
}));
