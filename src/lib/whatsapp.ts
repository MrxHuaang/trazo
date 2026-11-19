import { Linking } from 'react-native';

/** ADR-006. wa.me exige indicativo, así que a un celular de 10 dígitos se le antepone 57. */
export function enlaceWhatsApp(telefono: string, mensaje: string) {
  const digitos = telefono.replace(/\D/g, '');
  const numero = digitos.length === 10 ? `57${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Las llaves que no vengan en `valores` quedan vacías en lugar de mostrarse como {llave}. */
export function rellenarPlantilla(plantilla: string, valores: Record<string, string | undefined>) {
  return plantilla.replace(/\{(\w+)\}/g, (_, clave: string) => valores[clave] ?? '');
}

export async function abrirWhatsApp(telefono: string, mensaje: string) {
  await Linking.openURL(enlaceWhatsApp(telefono, mensaje));
}

export async function llamar(telefono: string) {
  await Linking.openURL(`tel:${telefono.replace(/\D/g, '')}`);
}
