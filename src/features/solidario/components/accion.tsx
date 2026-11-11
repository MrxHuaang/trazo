import type { ComponentType } from 'react';

import { cn } from '@/lib/cn';
import { color } from '@/theme';
import { Presionable, Text } from '@/ui';

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
  className?: string;
};

/** Acción compacta con ícono y texto en la misma línea. Área táctil de 44 pt. */
export function Accion({ label, onPress, icon: Icon, variante = 'pill', disabled, accessibilityLabel, accessibilityHint, className }: AccionProps) {
  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={variante === 'texto' ? 8 : 2}
      onPress={onPress}
      className={className}
      contentClassName={cn(
        'min-h-[44px] min-w-[44px] flex-row items-center justify-center gap-1.5',
        variante === 'pill' && 'rounded-full border border-line bg-surface px-3',
        disabled && 'opacity-40',
      )}>
      {Icon ? <Icon size={18} color={color.accent} /> : null}
      <Text variant="label" className="text-accent">
        {label}
      </Text>
    </Presionable>
  );
}

type BotonIconoProps = {
  icon: Icono;
  /** Etiqueta para lectores de pantalla (obligatoria: el botón no tiene texto visible). */
  label: string;
  onPress: () => void;
  /** Color del ícono (valor de los tokens). */
  tone?: string;
  /** Fondo: quiet sobre el lienzo, surface sobre el mapa. */
  fondo?: 'quiet' | 'surface';
  disabled?: boolean;
  className?: string;
};

/** Botón redondo de solo ícono, 44 × 44. */
export function BotonIcono({ icon: Icon, label, onPress, tone = color.ink, fondo = 'quiet', disabled, className }: BotonIconoProps) {
  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      className={className}
      hundir={0.92}
      contentClassName={cn(
        'h-11 w-11 items-center justify-center rounded-full',
        fondo === 'quiet' ? 'bg-quiet' : 'border border-line bg-surface',
        disabled && 'opacity-40',
      )}>
      <Icon size={20} color={tone} />
    </Presionable>
  );
}
