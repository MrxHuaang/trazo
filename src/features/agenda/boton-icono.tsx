import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { cn } from '@/lib/cn';
import { Presionable, Text } from '@/ui';

type BotonIconoProps = {
  icono: ReactNode;
  etiqueta: string;
  onPress: () => void;
  /** Fondo cobalto suave para la acción destacada de la cabecera. */
  destacado?: boolean;
  className?: string;
};

/** Botón redondo solo con ícono, de 44 de diámetro. */
export function BotonIcono({ icono, etiqueta, onPress, destacado, className }: BotonIconoProps) {
  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      className={className}
      hundir={0.92}
      contentClassName={cn('h-11 w-11 items-center justify-center rounded-full', destacado ? 'bg-accent-soft' : 'bg-quiet')}>
      {icono}
    </Presionable>
  );
}

type BotonTextoProps = {
  etiqueta: string;
  onPress: () => void;
  accessibilityLabel?: string;
  borde?: boolean;
  className?: string;
};

/** Acción de texto en cobalto (o píldora con borde de tinta) con área táctil de 44. */
export function BotonTexto({ etiqueta, onPress, accessibilityLabel, borde, className }: BotonTextoProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      onPress={onPress}
      className={cn(
        'min-h-[44px] justify-center active:opacity-60',
        borde ? 'rounded-full border border-ink px-4' : 'px-0.5',
        className,
      )}>
      <Text variant="label" className={borde ? 'text-ink' : 'text-accent'}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}
