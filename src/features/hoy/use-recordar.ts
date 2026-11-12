import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

import { useCambiarEstadoCita, useConsultorio, useMarcarRecordada } from '@/data/hooks';
import type { CitaConPaciente } from '@/domain/types';
import { confirmar } from '@/features/agenda/confirmar';
import { cancelarAviso, programarAviso } from '@/features/agenda/notifications';
import { abrirWhatsApp } from '@/lib/whatsapp';

import { mensajeRecordatorio } from './mensajes';

/**
 * HU-06: abre WhatsApp con la plantilla de recordatorio ya escrita y marca la cita como recordada
 * (RN-04: con eso sale de "Por confirmar"). De paso asegura el aviso local de 15 minutos antes.
 */
export function useRecordar() {
  const { data: consultorio } = useConsultorio();
  const marcar = useMarcarRecordada();

  async function recordar(cita: CitaConPaciente) {
    const telefono = cita.paciente.telefono;
    if (!telefono || !consultorio) return;
    try {
      await abrirWhatsApp(telefono, mensajeRecordatorio(consultorio.plantillaRecordatorio, cita));
    } catch {
      Alert.alert('No se pudo abrir WhatsApp', 'Revisa que WhatsApp esté instalado en este teléfono.');
      return;
    }
    marcar.mutate(cita.id, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void programarAviso(cita.id, cita.inicio);
      },
      onError: () => Alert.alert('No se guardó el recordatorio', 'El mensaje se abrió, pero la cita no quedó marcada. Intenta de nuevo.'),
    });
  }

  return {
    recordar,
    /** Id de la cita que se está marcando. */
    marcando: marcar.isPending ? marcar.variables : undefined,
    disponible: !!consultorio,
  };
}

/**
 * Marca "asistió" desde la lista (RN-05: crea el pago según la tarifa) y quita el aviso local.
 * Si la cita aún no empieza, pide confirmación para no registrar una sesión por error.
 */
export function useAsistio() {
  const cambiar = useCambiarEstadoCita();

  async function asistio(cita: CitaConPaciente) {
    if (new Date(cita.inicio).getTime() > Date.now()) {
      const seguir = await confirmar({
        titulo: 'Esta cita aún no empieza',
        mensaje: `¿Registrar que ${cita.paciente.nombre} ya asistió? Se crea el cobro de la sesión.`,
        aceptar: 'Marcar asistió',
      });
      if (!seguir) return;
    }
    cambiar.mutate(
      { id: cita.id, estado: 'asistio' },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          void cancelarAviso(cita.id);
        },
        onError: (e) => Alert.alert('No se guardó la asistencia', e instanceof Error ? e.message : 'Intenta de nuevo.'),
      },
    );
  }

  return { asistio, guardando: cambiar.isPending };
}
