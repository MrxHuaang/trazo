import type { ReactNode } from 'react';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { cn } from '@/lib/cn';
import { color } from '@/theme';

import { Presionable } from './presionable';
import { Text } from './text';

type Variante = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary: tinta (acción principal de la pantalla) · accent: cobalto · secondary: borde · ghost: solo texto · danger */
  variant?: Variante;
  size?: 'md' | 'sm';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const FONDO: Record<Variante, string> = {
  primary: 'bg-ink',
  accent: 'bg-accent',
  secondary: 'border border-ink bg-transparent',
  ghost: 'bg-transparent',
  danger: 'bg-danger-bg',
};
const TEXTO: Record<Variante, string> = {
  primary: 'text-accent-on',
  accent: 'text-accent-on',
  secondary: 'text-ink',
  ghost: 'text-accent',
  danger: 'text-danger',
};
const INDICADOR: Record<Variante, string> = {
  primary: color.onAccent,
  accent: color.onAccent,
  secondary: color.ink,
  ghost: color.accent,
  danger: color.danger,
};

export function Button({ label, onPress, variant = 'primary', size = 'md', icon, loading, disabled, className, style, accessibilityHint }: ButtonProps) {
  const inactivo = disabled || loading;
  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactivo, busy: !!loading }}
      disabled={inactivo}
      onPress={onPress}
      className={className}
      style={style}
      contentClassName={cn(
        'items-center justify-center rounded-full px-5',
        size === 'sm' ? 'min-h-[44px] px-4' : 'min-h-[52px]',
        FONDO[variant],
        inactivo && 'opacity-50',
      )}>
      {loading ? (
        <ActivityIndicator color={INDICADOR[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text variant={size === 'sm' ? 'label' : 'bodyMedium'} className={TEXTO[variant]}>
            {label}
          </Text>
        </View>
      )}
    </Presionable>
  );
}
