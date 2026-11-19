import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { Text } from '@/ui';

type SeccionProps = {
  titulo: string;
  detalle?: string;
  /** Va a la derecha del título, p. ej. "Ver todos". */
  accion?: ReactNode;
  className?: string;
};

export function Seccion({ titulo, detalle, accion, className }: SeccionProps) {
  return (
    <View className={cn('mt-4 flex-row items-center gap-3', className)}>
      <View className="flex-1 gap-0.5">
        <Text variant="heading" accessibilityRole="header">
          {titulo}
        </Text>
        {detalle ? (
          <Text variant="caption" className="text-ink-soft">
            {detalle}
          </Text>
        ) : null}
      </View>
      {accion}
    </View>
  );
}
