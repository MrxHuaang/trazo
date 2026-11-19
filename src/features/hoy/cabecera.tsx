import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { color } from '@/theme';

import { BotonIcono } from './boton-icono';

/** Si la pantalla se abrió por enlace no hay historial, así que cae en Hoy. */
export function volver() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// Sin título a propósito: el título grande va en el contenido, igual que en Hoy.
export function Cabecera({ accion }: { accion?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-3 py-1">
      <BotonIcono etiqueta="Volver" onPress={volver} icono={<CaretLeftIcon size={22} color={color.ink} />} />
      <View className="min-w-[44px] items-end">{accion}</View>
    </View>
  );
}
