import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { cn } from '@/lib/cn';

type ProgresoHistoriasProps = {
  total: number;
  actual: number;
  /** Avance de la historia actual, de 0 a 1. */
  avance: SharedValue<number>;
};

/** Barra por segmentos de las historias: llenos los vistos, el actual se llena con el tiempo. */
export function ProgresoHistorias({ total, actual, avance }: ProgresoHistoriasProps) {
  return (
    <View className="flex-1 flex-row gap-1" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, i) => (
        <View key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/15">
          {i === actual ? <Relleno avance={avance} /> : <View className={cn('h-full', i < actual ? 'w-full bg-ink' : 'w-0')} />}
        </View>
      ))}
    </View>
  );
}

function Relleno({ avance }: { avance: SharedValue<number> }) {
  const ancho = useAnimatedStyle(() => ({ width: `${Math.min(1, Math.max(0, avance.get())) * 100}%` }));
  return <Animated.View style={ancho} className="h-full bg-ink" />;
}
