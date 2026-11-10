import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme';

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
    <View style={styles.fila}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={volver}
        style={({ pressed }) => [styles.volver, pressed && styles.pressed]}>
        <CaretLeftIcon size={22} color={color.ink} />
      </Pressable>
      <View style={styles.accion}>{accion}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  volver: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: color.quiet },
  accion: { minWidth: 44, alignItems: 'flex-end' },
});
