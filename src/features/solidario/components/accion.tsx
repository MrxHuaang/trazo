import type { ComponentType } from 'react';

import { cn } from '@/lib/cn';
import { color } from '@/theme';
import { Presionable, Text } from '@/ui';

export type Icono = ComponentType<{ size?: number; color?: string }>;

type AccionProps = {
  label: string;
  onPress: () => void;
  icon?: Icono;
  /** `texto` para enlaces tipo "Ver todos"; `pill` para acciones de fila. */
  variante?: 'pill' | 'texto';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  className?: string;
};

/** Ícono y texto en línea; el área táctil no baja de 44 pt. */
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
  /** Obligatoria: es lo único que oye el lector de pantalla. */
  label: string;
  onPress: () => void;
  /** Valor crudo de los tokens, no una clase. */
  tone?: string;
  /** `surface` cuando va encima del mapa. */
  fondo?: 'quiet' | 'surface';
  disabled?: boolean;
  className?: string;
};

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
