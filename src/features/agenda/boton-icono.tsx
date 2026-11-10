import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

type BotonIconoProps = {
  icono: ReactNode;
  etiqueta: string;
  onPress: () => void;
};

/** Botón redondo solo con ícono: 40 de diámetro más margen táctil hasta 48. */
export function BotonIcono({ icono, etiqueta, onPress }: BotonIconoProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      hitSlop={4}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.icono, pressed && styles.pressed]}>
      {icono}
    </Pressable>
  );
}

type BotonTextoProps = {
  etiqueta: string;
  onPress: () => void;
  accessibilityLabel?: string;
  borde?: boolean;
};

/** Acción de texto en cobalto (o píldora con borde de tinta) con área táctil de 44. */
export function BotonTexto({ etiqueta, onPress, accessibilityLabel, borde }: BotonTextoProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      hitSlop={borde ? 4 : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.texto, borde && styles.borde, pressed && styles.pressed]}>
      <Text variant="label" tone={borde ? color.ink : color.accent}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icono: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 2 },
  borde: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: color.ink,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
  },
  pressed: { opacity: 0.6 },
});
