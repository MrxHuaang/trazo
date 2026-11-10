/**
 * Acciones hacia fuera de la app (llamar, WhatsApp, compartir) con un aviso tranquilo si fallan,
 * por ejemplo en un emulador sin marcador o sin WhatsApp instalado.
 */
import { Alert, Share } from 'react-native';

import { abrirWhatsApp, llamar } from '@/lib/whatsapp';

export function llamarA(telefono: string | null | undefined) {
  if (!telefono) return;
  llamar(telefono).catch(() => Alert.alert('No se pudo abrir el teléfono', 'Revisa que el dispositivo pueda hacer llamadas.'));
}

export function escribirPorWhatsApp(telefono: string | null | undefined, mensaje: string) {
  if (!telefono) return;
  abrirWhatsApp(telefono, mensaje).catch(() =>
    Alert.alert('No se pudo abrir WhatsApp', 'Revisa que WhatsApp esté instalado en este teléfono.'),
  );
}

/** Hoja nativa de compartir (WhatsApp, mensajes, correo…). */
export function compartirTexto(mensaje: string, titulo?: string) {
  Share.share({ message: mensaje, title: titulo }, { dialogTitle: titulo }).catch(() =>
    Alert.alert('No se pudo compartir', 'Intenta de nuevo en un momento.'),
  );
}

export function avisarError(titulo: string) {
  return (e: unknown) => Alert.alert(titulo, e instanceof Error ? e.message : 'Intenta de nuevo en un momento.');
}
