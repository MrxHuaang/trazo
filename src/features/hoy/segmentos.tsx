import { View } from 'react-native';

import { cn } from '@/lib/cn';

type SegmentosProps = {
  usados: number;
  total: number;
  className?: string;
};

/**
 * Contador por segmentos (sin barra de progreso): un segmento por cupo solidario, relleno si está usado.
 * Es decorativo: el número del bloque ya lo anuncia el lector de pantalla.
 */
export function Segmentos({ usados, total, className }: SegmentosProps) {
  if (total <= 0) return null;
  return (
    <View
      className={cn('mt-2 flex-row gap-1', className)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={cn('h-2 max-w-[40px] flex-1 rounded-full border-[1.5px] border-durazno-ink', i < usados && 'bg-durazno-ink')}
        />
      ))}
    </View>
  );
}
