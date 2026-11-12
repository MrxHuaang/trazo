import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

type MedidorCuposProps = {
  usados: number;
  total: number;
};

/**
 * Medidor por segmentos sobre el bloque durazno: un segmento por cupo, lleno si ya se usó.
 * No es una barra con fondo: cada cupo es una pieza separada con borde, así se lee sin depender del color.
 * Al entrar, los segmentos usados se llenan uno a uno.
 */
export function MedidorCupos({ usados, total }: MedidorCuposProps) {
  if (total <= 0) return null;
  const llenos = Math.min(usados, total);
  return (
    <View
      className="flex-row gap-[5px]"
      accessible
      accessibilityLabel="Cupos solidarios usados"
      accessibilityValue={{ min: 0, max: total, now: llenos, text: `${usados} de ${total}` }}>
      {Array.from({ length: total }, (_, i) => (
        <Segmento key={i} lleno={i < llenos} orden={i} />
      ))}
    </View>
  );
}

function Segmento({ lleno, orden }: { lleno: boolean; orden: number }) {
  const reducir = useReducedMotion();
  const avance = useSharedValue(0);

  useEffect(() => {
    if (reducir) {
      avance.set(lleno ? 1 : 0);
      return;
    }
    avance.set(
      lleno
        ? withDelay(180 + orden * 110, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }))
        : withTiming(0, { duration: 180 }),
    );
  }, [lleno, orden, reducir, avance]);

  const relleno = useAnimatedStyle(() => ({ width: `${avance.get() * 100}%` }));

  return (
    <View className="h-[10px] flex-1 overflow-hidden rounded-full border border-durazno-ink">
      <Animated.View className="h-full bg-durazno-ink" style={relleno} />
    </View>
  );
}
