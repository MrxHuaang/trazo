import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, radius, space } from '@/theme';

import { Text } from './text';

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary: tinta (acción principal de la pantalla) · accent: cobalto · secondary: borde · ghost: solo texto · danger */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const FONDO = { primary: color.ink, accent: color.accent, secondary: 'transparent', ghost: 'transparent', danger: color.dangerBg };
const TEXTO = { primary: color.onAccent, accent: color.onAccent, secondary: color.ink, ghost: color.accent, danger: color.danger };

export function Button({ label, onPress, variant = 'primary', size = 'md', icon, loading, disabled, style, accessibilityHint }: ButtonProps) {
  const inactivo = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactivo, busy: !!loading }}
      disabled={inactivo}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        { backgroundColor: FONDO[variant] },
        variant === 'secondary' && styles.outline,
        pressed && styles.pressed,
        inactivo && styles.inactivo,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={TEXTO[variant]} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant={size === 'sm' ? 'label' : 'bodyMedium'} tone={TEXTO[variant]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { minHeight: 36, paddingHorizontal: space.lg },
  outline: { borderWidth: 1, borderColor: color.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pressed: { transform: [{ scale: 0.98 }] },
  inactivo: { opacity: 0.5 },
});
