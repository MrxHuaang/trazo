// Solo estado de UI. Vive fuera de la pantalla para no perder el mes ni el último método al volver.
import { create } from 'zustand';

import type { MetodoPago } from '@/domain/types';
import { mesClave } from '@/lib/dates';

type EstadoPagos = {
  /** Mes que se está viendo ('yyyy-MM'). */
  mes: string;
  /** Pago con el panel de registro abierto. */
  filaAbierta: string | null;
  /** Se propone por defecto en el siguiente registro. */
  metodo: MetodoPago;
  elegirMes: (mes: string) => void;
  abrirFila: (pagoId: string | null) => void;
  elegirMetodo: (metodo: MetodoPago) => void;
};

export const usePagosStore = create<EstadoPagos>((set) => ({
  mes: mesClave(),
  filaAbierta: null,
  metodo: 'nequi',
  elegirMes: (mes) => set({ mes }),
  abrirFila: (filaAbierta) => set({ filaAbierta }),
  elegirMetodo: (metodo) => set({ metodo }),
}));
