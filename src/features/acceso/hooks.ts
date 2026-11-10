/**
 * Mutaciones propias del módulo acceso: crear el consultorio, cargar la demostración y borrar todo.
 * Las tres reescriben datos de todos los módulos, por eso invalidan todas las consultas.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { borrarTodo } from '@/data/db';
import { qk } from '@/data/keys';
import { crearConsultorio, obtenerConsultorio, type NuevoConsultorio } from '@/data/repos/consultorio';
import { cargarDemo } from '@/data/seed';

import { abrirSesion } from './sesion';

/** HU-26: registro local del consultorio. La sesión queda abierta para no pedir desbloqueo de inmediato. */
export function useCrearConsultorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: NuevoConsultorio) => crearConsultorio(datos),
    onSuccess: async (consultorio) => {
      abrirSesion();
      // Se fija antes de navegar: el AccessGate no debe ver un consultorio vacío al salir de la bienvenida.
      qc.setQueryData(qk.consultorio, consultorio);
      await qc.invalidateQueries();
    },
  });
}

/** HU-27: reemplaza todo por los datos ficticios de demostración. */
export function useCargarDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await cargarDemo();
      return obtenerConsultorio();
    },
    onSuccess: async (consultorio) => {
      abrirSesion();
      qc.setQueryData(qk.consultorio, consultorio);
      await qc.invalidateQueries();
    },
  });
}

/** Borra todos los datos del teléfono. El AccessGate ve que no hay consultorio y lleva a la bienvenida. */
export function useBorrarTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: borrarTodo,
    onSuccess: async () => {
      qc.setQueryData(qk.consultorio, null);
      await qc.invalidateQueries();
    },
  });
}
