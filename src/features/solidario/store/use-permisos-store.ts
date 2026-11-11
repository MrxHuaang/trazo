import { create } from 'zustand';

import { comprobarPermisoUbicacion, pedirPermisoUbicacion, type EstadoPermiso } from '../mapa/ubicacion';

type PermisosState = {
  ubicacion: EstadoPermiso;
  comprobarUbicacion: () => Promise<EstadoPermiso>;
  pedirUbicacion: () => Promise<EstadoPermiso>;
};

/** Estado del permiso de ubicación (Zustand). El mapa funciona con cualquier estado. */
export const usePermisosStore = create<PermisosState>()((set) => ({
  ubicacion: 'comprobando',

  comprobarUbicacion: async () => {
    const estado = await comprobarPermisoUbicacion().catch((): EstadoPermiso => 'bloqueado');
    set({ ubicacion: estado });
    return estado;
  },

  pedirUbicacion: async () => {
    const estado = await pedirPermisoUbicacion().catch((): EstadoPermiso => 'bloqueado');
    set({ ubicacion: estado });
    return estado;
  },
}));
