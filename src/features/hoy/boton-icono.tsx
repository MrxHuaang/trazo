import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { Presionable } from '@/ui';

type BotonIconoProps = {
  icono: ReactNode;
  etiqueta: string;
  onPress: () => void;
  disabled?: boolean;
  /** Clases del círculo (p. ej. un fondo). */
  className?: string;
};

/** Botón redondo solo con ícono: área táctil de 44 y etiqueta para el lector de pantalla. */
export function BotonIcono({ icono, etiqueta, onPress, disabled, className }: BotonIconoProps) {
  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hundir={0.9}
      contentClassName={cn('h-11 w-11 items-center justify-center rounded-full', disabled && 'opacity-30', className)}>
      {icono}
    </Presionable>
  );
}
