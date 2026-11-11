import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { color } from '@/theme';

import { BotonIcono } from './boton-icono';

/** Vuelve a la pantalla anterior; si se abrió directo (enlace), va a "Hoy". */
export function volver() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/**
 * Barra superior de las pantallas apiladas del módulo (Pagos, Plantillas): botón Volver y una acción.
 * El título grande va en el contenido, como en "Hoy".
 */
export function Cabecera({ accion }: { accion?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-3 py-1">
      <BotonIcono etiqueta="Volver" onPress={volver} icono={<CaretLeftIcon size={22} color={color.ink} />} />
      <View className="min-w-[44px] items-end">{accion}</View>
    </View>
  );
}
