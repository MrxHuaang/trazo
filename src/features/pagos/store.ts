/**
 * Estado de interfaz de Pagos (Zustand): no son datos, solo dónde estaba la profesional.
 * Se conserva mientras la app está abierta, así volver a Pagos no pierde el mes ni el método habitual.
 */
import { create } from 'zustand';

import type { MetodoPago } from '@/domain/types';
import { mesClave } from '@/lib/dates';

type EstadoPagos = {
  /** Mes que se está viendo ('yyyy-MM'). */
  mes: string;
  /** Pago pendiente con el panel "Registrar" desplegado. */
  filaAbierta: string | null;
  /** Último método usado: se propone en el siguiente registro. */
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
