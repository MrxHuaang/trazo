import { Alert } from 'react-native';

import { useConsultorio, useMarcarRecordada } from '@/data/hooks';
import type { CitaConPaciente } from '@/domain/types';
import { abrirWhatsApp } from '@/lib/whatsapp';

import { mensajeRecordatorio } from './mensajes';

/**
 * HU-06: abre WhatsApp con la plantilla de recordatorio ya escrita y marca la cita como recordada
 * (RN-04: con eso sale de "Por confirmar").
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
