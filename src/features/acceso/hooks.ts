// Estas mutaciones tocan datos de toda la app, por eso invalidan todas las consultas.
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { borrarTodo } from '@/data/db';
import { qk } from '@/data/keys';
import { crearConsultorio, obtenerConsultorio, type NuevoConsultorio } from '@/data/repos/consultorio';
import { cargarDemo } from '@/data/seed';

import { abrirSesion } from './sesion';

/** HU-26. Deja la sesión abierta para no pedir desbloqueo recién creado el consultorio. */
export function useCrearConsultorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: NuevoConsultorio) => crearConsultorio(datos),
    onSuccess: async (consultorio) => {
      abrirSesion();
      // Antes de navegar, o el AccessGate alcanza a ver el consultorio vacío y vuelve a la bienvenida.
      qc.setQueryData(qk.consultorio, consultorio);
      await qc.invalidateQueries();
    },
  });
}

/** HU-27. Reemplaza lo que haya por los datos ficticios. */
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

/** Con el consultorio en null, el AccessGate vuelve solo a la bienvenida. */
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
