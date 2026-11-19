import { create } from 'zustand';

import { obtenerUbicacionActual, type LatLng } from '../mapa/ubicacion';

type UbicacionState = {
  /** Solo en memoria: no se guarda ni se envía. */
  ultima: LatLng | null;
  buscando: boolean;
  /** GPS apagado o sin señal. */
  fallo: boolean;
  obtener: () => Promise<LatLng | null>;

  /** Lo fija el mapa en modo selección y lo lee el formulario de jornada. */
  puntoJornada: LatLng | null;
  fijarPuntoJornada: (punto: LatLng | null) => void;
};

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
