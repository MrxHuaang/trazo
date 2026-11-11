import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AnilloCuentaProps = {
  /** 1 = lleno, 0 = vacío. */
  progreso: number;
  /** Color del anillo (token del bloque donde se dibuja). */
  color: string;
  size?: number;
  grosor?: number;
  children?: ReactNode;
};

/**
 * Anillo de cuenta regresiva: se vacía a medida que se acerca la cita.
 * Es decorativo; el texto del bloque ya dice cuánto falta.
 */
export function AnilloCuenta({ progreso, color, size = 72, grosor = 6, children }: AnilloCuentaProps) {
  const reducir = useReducedMotion();
  const radio = (size - grosor) / 2;
  const perimetro = 2 * Math.PI * radio;
  const lleno = useSharedValue(1);

  useEffect(() => {
    lleno.set(reducir ? progreso : withTiming(progreso, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [progreso, reducir, lleno]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: perimetro * (1 - lleno.get()) }));

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View className="absolute inset-0">
        <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radio} stroke={color} strokeOpacity={0.18} strokeWidth={grosor} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${perimetro} ${perimetro}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        </Svg>
      </View>
      {children}
    </View>
  );
}
