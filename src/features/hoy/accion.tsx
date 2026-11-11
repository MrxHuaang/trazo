import { ActivityIndicator } from 'react-native';

import { color } from '@/theme';
import { Presionable, Text } from '@/ui';

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
 * Acción de texto en cobalto para el final de una fila, con área táctil de 44 pt
 * y estado desactivado/ocupado. Es la alternativa visible a los gestos de deslizar.
 */
export function Accion({ label, onPress, accessibilityLabel, accessibilityHint, disabled, loading }: AccionProps) {
  const inactiva = disabled || loading;
  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactiva, busy: !!loading }}
      disabled={inactiva}
      onPress={onPress}
      contentClassName="min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-2">
      {loading ? (
        <ActivityIndicator size="small" color={color.accent} />
      ) : (
        <Text variant="label" className={disabled ? 'text-ink-soft' : 'text-accent'}>
          {label}
        </Text>
      )}
    </Presionable>
  );
}
