import * as Haptics from 'expo-haptics';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

export type Icono = ComponentType<{ size?: number; color?: string }>;

type AccionProps = {
  label: string;
  onPress: () => void;
  icon?: Icono;
  /** pill: píldora con borde (acciones de fila) · texto: solo texto cobalto (enlaces como "Ver todos"). */
  variante?: 'pill' | 'texto';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/** Acción compacta con ícono y texto. Área táctil de 44 pt. */
export function Accion({ label, onPress, icon: Icon, variante = 'pill', disabled, accessibilityLabel, accessibilityHint }: AccionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={variante === 'texto' ? 8 : 2}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        variante === 'pill' && styles.pill,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {Icon ? <Icon size={18} color={color.accent} /> : null}
      <Text variant="label" tone={color.accent}>
        {label}
      </Text>
    </Pressable>
  );
}

type BotonIconoProps = {
  icon: Icono;
  /** Etiqueta para lectores de pantalla (obligatoria: el botón no tiene texto visible). */
  label: string;
  onPress: () => void;
  tone?: string;
  disabled?: boolean;
};

/** Botón redondo de solo ícono, 44 × 44. */
export function BotonIcono({ icon: Icon, label, onPress, tone = color.ink, disabled }: BotonIconoProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.icono, pressed && styles.pressed, disabled && styles.disabled]}>
      <Icon size={20} color={tone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});
