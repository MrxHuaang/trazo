import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';

type AparecerProps = {
  children: ReactNode;
  /** Cada posición entra 45 ms después de la anterior. */
  orden?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Para listas que se reordenan o pierden filas. */
  reacomodar?: boolean;
};

/** Entrada en cascada al montar. El orden se topa en 10 para que una lista larga no tarde en aparecer. */
export function Aparecer({ children, orden = 0, className, style, reacomodar }: AparecerProps) {
  return (
    <Animated.View
      className={className}
      style={style}
      entering={FadeInDown.delay(Math.min(orden, 10) * 45)
        .springify()
        .damping(18)
        .stiffness(190)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] })
        .reduceMotion(ReduceMotion.System)}
      layout={reacomodar ? LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System) : undefined}>
      {children}
    </Animated.View>
  );
}
