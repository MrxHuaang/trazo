// Estado de UI de la Agenda. Está fuera de la pantalla para que otras puedan abrirla en un día concreto.
import { create } from 'zustand';

import { hoyClave, sumarDias } from '@/lib/dates';

type Resaltado = { dia: string; ini: number };

type AgendaStore = {
  /** Día mostrado, 'yyyy-MM-dd' en hora de Colombia. */
  dia: string;
  /** 1 adelante, -1 atrás, 0 sin cambio. Decide desde qué lado entra el día. */
  direccion: 1 | -1 | 0;
  /** Hueco que la línea de tiempo debe mostrar con un pulso (p. ej. el próximo libre). */
  resaltado: Resaltado | null;
  irADia: (dia: string) => void;
  irAHoy: () => void;
  moverSemana: (sentido: 1 | -1) => void;
  resaltar: (hueco: Resaltado) => void;
  quitarResaltado: () => void;
};

export const useAgendaStore = create<AgendaStore>((set, get) => ({
  dia: hoyClave(),
  direccion: 0,
  resaltado: null,
  irADia: (dia) => {
    const actual = get().dia;
    if (dia === actual) return;
    set({ dia, direccion: dia > actual ? 1 : -1 });
  },
  irAHoy: () => get().irADia(hoyClave()),
  moverSemana: (sentido) => get().irADia(sumarDias(get().dia, sentido * 7)),
  resaltar: (hueco) => {
    get().irADia(hueco.dia);
    set({ resaltado: hueco });
  },
  quitarResaltado: () => set({ resaltado: null }),
}));

/** Llamar antes de router.navigate('/agenda'). */
export const abrirAgendaEn = (dia: string) => useAgendaStore.getState().irADia(dia);
