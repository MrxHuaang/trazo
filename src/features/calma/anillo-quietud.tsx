import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { color } from '@/theme';

import { META_QUIETUD } from './quietud-reglas';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AnilloQuietudProps = {
  /** Segundos de calma acumulados (continuo, en el hilo de la interfaz). */
  progreso: SharedValue<number>;
  /** Con "Reducir movimiento": segundos enteros, el anillo salta de a un segundo sin deslizarse. */
  estatico?: number;
  size?: number;
  children?: ReactNode;
};

/** Anillo de progreso hacia los 30 segundos de quietud; el centro queda libre para la cuenta. */
export function AnilloQuietud({ progreso, estatico, size = 220, children }: AnilloQuietudProps) {
  const grosor = 10;
  const radio = (size - grosor) / 2;
  const vuelta = 2 * Math.PI * radio;
  const centro = size / 2;

  const desfase = (segundos: number) => {
    'worklet';
    return vuelta * (1 - Math.min(1, Math.max(0, segundos / META_QUIETUD)));
  };
  const animado = useAnimatedProps(() => ({ strokeDashoffset: desfase(progreso.get()) }));

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <View className="absolute inset-0">
        <Svg width={size} height={size}>
          <Circle cx={centro} cy={centro} r={radio} stroke={color.line} strokeWidth={grosor} fill="none" />
          {estatico !== undefined ? (
            <Circle
              cx={centro}
              cy={centro}
              r={radio}
              stroke={color.accent}
              strokeWidth={grosor}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={vuelta}
              strokeDashoffset={desfase(estatico)}
              transform={`rotate(-90 ${centro} ${centro})`}
            />
          ) : (
            <AnimatedCircle
              cx={centro}
              cy={centro}
              r={radio}
              stroke={color.accent}
              strokeWidth={grosor}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={vuelta}
              strokeDashoffset={vuelta}
              animatedProps={animado}
              transform={`rotate(-90 ${centro} ${centro})`}
            />
          )}
        </Svg>
      </View>
      {children}
    </View>
  );
}
