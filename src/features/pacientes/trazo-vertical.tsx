import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';

import { color } from '@/theme';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

type TrazoVerticalProps = {
  alto: number;
  ancho: number;
};

/**
 * El Trazo en vertical para la historia del paciente: en calma arriba (lo reciente)
 * y agitado abajo (el inicio del proceso). Al entrar se dibuja de arriba hacia abajo,
 * como la aguja de un sismógrafo (con "Reducir movimiento" aparece completo).
 */
export function TrazoVertical({ alto, ancho }: TrazoVerticalProps) {
  const reducir = useReducedMotion();
  const avance = useSharedValue(reducir ? 1 : 0);
  const { puntos, largo } = geometriaTrazo(ancho, alto);
  // Un poco más que el largo real para que la punta redondeada no asome antes de tiempo.
  const tramo = largo + 4;

  useEffect(() => {
    if (!reducir) avance.set(withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [reducir, avance]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: tramo * (1 - avance.get()) }));

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 top-0"
      style={{ width: ancho, height: alto }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={ancho} height={alto}>
        <AnimatedPolyline
          points={puntos}
          animatedProps={animatedProps}
          strokeDasharray={[tramo, tramo]}
          fill="none"
          stroke={color.ink}
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

/**
 * Puntos de la línea y su longitud. El tramo final (inicio del proceso) oscila con amplitud creciente;
 * lo demás es una recta en calma.
 */
function geometriaTrazo(ancho: number, alto: number) {
  if (alto <= 0 || ancho <= 0) return { puntos: '', largo: 0 };
  const cx = ancho / 2;
  const maxAmp = ancho / 2 - 2;
  const agitado = Math.min(alto * 0.4, 200);
  const calmaHasta = alto - agitado;
  const paso = 2.5;

  let puntos = `${cx.toFixed(1)},0 `;
  let largo = 0;
  let xPrevio = cx;
  let yPrevio = 0;
  for (let y = Math.floor(calmaHasta / paso) * paso; y <= alto; y += paso) {
    const t = y <= calmaHasta ? 0 : (y - calmaHasta) / agitado;
    const amp = maxAmp * Math.pow(t, 1.5) * 0.9;
    const vaiven = Math.sin(y * 0.16 + 1.2) * 0.8 + Math.sin(y * 0.41 + 1.3) * 0.2;
    const x = cx + amp * vaiven;
    puntos += `${x.toFixed(1)},${y.toFixed(1)} `;
    largo += Math.hypot(x - xPrevio, y - yPrevio);
    xPrevio = x;
    yPrevio = y;
  }
  return { puntos, largo };
}
