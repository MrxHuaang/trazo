import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

type AccionProps = {
  label: string;
  onPress: () => void;
  /** Texto que lee el lector de pantalla cuando la etiqueta sola no basta (p. ej. "Recordar a Laura"). */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * Acción de texto en cobalto para el final de una fila. Igual que el Chip de `src/ui`,
 * pero con área táctil de 44 pt y estado desactivado/ocupado.
 */
export function Accion({ label, onPress, accessibilityLabel, accessibilityHint, disabled, loading }: AccionProps) {
  const inactiva = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactiva, busy: !!loading }}
      disabled={inactiva}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}>
      {loading ? (
        <ActivityIndicator size="small" color={color.accent} />
      ) : (
        <Text variant="label" tone={disabled ? color.inkSoft : color.accent}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: color.quiet },
});
