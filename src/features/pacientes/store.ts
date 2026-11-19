import { create } from 'zustand';

import type { FiltroLista } from './rules';

type EstadoLista = {
  consulta: string;
  filtro: FiltroLista;
  setConsulta: (consulta: string) => void;
  setFiltro: (filtro: FiltroLista) => void;
};

/**
 * Búsqueda y filtro de la lista, aquí para que sobrevivan a abrir una ficha o cambiar de pestaña.
 * Solo estado de interfaz: ningún dato de pacientes pasa por este store.
 */
export const usePacientesStore = create<EstadoLista>()((set) => ({
  consulta: '',
  filtro: 'todos',
  setConsulta: (consulta) => set({ consulta }),
  setFiltro: (filtro) => set({ filtro }),
}));
