import { create } from 'zustand';

import type { FiltroLista } from './rules';

type EstadoLista = {
  /** Lo escrito en el buscador de la pestaña Pacientes. */
  consulta: string;
  filtro: FiltroLista;
  setConsulta: (consulta: string) => void;
  setFiltro: (filtro: FiltroLista) => void;
};

/**
 * Estado de interfaz de la lista de pacientes (Zustand): la búsqueda y el filtro se conservan
 * al abrir una ficha y volver, o al cambiar de pestaña. No guarda datos de pacientes.
 */
export const usePacientesStore = create<EstadoLista>()((set) => ({
  consulta: '',
  filtro: 'todos',
  setConsulta: (consulta) => set({ consulta }),
  setFiltro: (filtro) => set({ filtro }),
}));
