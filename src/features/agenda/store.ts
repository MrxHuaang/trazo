/**
 * Estado de interfaz de la Agenda (Zustand): el día que se muestra y el hueco que se resalta.
 * Vive fuera de la pantalla para que otras puedan abrir la Agenda en un día concreto:
 *
 *   abrirAgendaEn('2026-11-20');
 *   router.navigate('/agenda');
 */
import { create } from 'zustand';

import { hoyClave, sumarDias } from '@/lib/dates';

type Resaltado = { dia: string; ini: number };

type AgendaStore = {
  /** Día mostrado, 'yyyy-MM-dd' en hora de Colombia. */
  dia: string;
  /** Sentido del último cambio de día (1 adelante, -1 atrás, 0 sin cambio): orienta la animación. */
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

/** Para otras pantallas: deja la Agenda lista en ese día antes de navegar a ella. */
export const abrirAgendaEn = (dia: string) => useAgendaStore.getState().irADia(dia);
