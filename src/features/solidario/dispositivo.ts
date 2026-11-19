// Salidas a otras apps. Si fallan (emulador sin marcador, sin WhatsApp) se avisa con un Alert.
import { Alert, Linking, Platform, Share } from 'react-native';

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

export function compartirTexto(mensaje: string, titulo?: string) {
  Share.share({ message: mensaje, title: titulo }, { dialogTitle: titulo }).catch(() =>
    Alert.alert('No se pudo compartir', 'Intenta de nuevo en un momento.'),
  );
}

export function avisarError(titulo: string) {
  return (e: unknown) => Alert.alert(titulo, e instanceof Error ? e.message : 'Intenta de nuevo en un momento.');
}

/** `geo:` en Android y Apple Maps en iPhone; si nada abre, Google Maps en el navegador. */
export function comoLlegar(punto: { latitud: number; longitud: number }, etiqueta: string) {
  const destino = `${punto.latitud},${punto.longitud}`;
  const web = `https://www.google.com/maps/dir/?api=1&destination=${destino}`;
  const url =
    Platform.select({
      ios: `http://maps.apple.com/?daddr=${destino}&dirflg=d`,
      android: `geo:${destino}?q=${destino}(${encodeURIComponent(etiqueta)})`,
    }) ?? web;
  Linking.openURL(url)
    .catch(() => Linking.openURL(web))
    .catch(() => Alert.alert('No se pudo abrir el mapa', 'Revisa que el teléfono tenga una app de mapas.'));
}
