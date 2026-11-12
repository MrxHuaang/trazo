import { Linking } from 'react-native';

/** Enlace wa.me con mensaje listo (ADR-006). Celular colombiano de 10 dígitos → prefijo 57. */
export function enlaceWhatsApp(telefono: string, mensaje: string) {
  const digitos = telefono.replace(/\D/g, '');
  const numero = digitos.length === 10 ? `57${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Reemplaza {nombre}, {fecha}, {hora}, {modalidad}, {enlace} en una plantilla. */
export function rellenarPlantilla(plantilla: string, valores: Record<string, string | undefined>) {
  return plantilla.replace(/\{(\w+)\}/g, (_, clave: string) => valores[clave] ?? '');
}

export async function abrirWhatsApp(telefono: string, mensaje: string) {
  await Linking.openURL(enlaceWhatsApp(telefono, mensaje));
}

export async function llamar(telefono: string) {
  await Linking.openURL(`tel:${telefono.replace(/\D/g, '')}`);
}
