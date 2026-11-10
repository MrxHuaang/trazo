import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
 * y agitado abajo (el inicio del proceso). Al aparecer, toda la línea vibra y se calma
 * (se desactiva con "Reducir movimiento").
 */
export function TrazoVertical({ alto, ancho }: TrazoVerticalProps) {
  const reduceMotion = useReducedMotion();
  const energia = useSharedValue(reduceMotion ? 1 : 2.2);

  useEffect(() => {
    if (!reduceMotion) energia.set(withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, [reduceMotion, energia]);

  const animatedProps = useAnimatedProps(() => ({ points: puntosTrazo(ancho, alto, energia.get()) }));

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { width: ancho, height: alto }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={ancho} height={alto}>
        <AnimatedPolyline
          points={puntosTrazo(ancho, alto, 1)}
          animatedProps={animatedProps}
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
 * Puntos de la línea vertical. El tramo final (inicio del proceso) oscila con amplitud creciente;
 * con energía > 1 toda la línea vibra un poco (animación de carga).
 */
function puntosTrazo(ancho: number, alto: number, energia: number) {
  'worklet';
  if (alto <= 0 || ancho <= 0) return '';
  const cx = ancho / 2;
  const maxAmp = ancho / 2 - 2;
  const tramo = Math.min(alto * 0.4, 200);
  const calmaHasta = alto - tramo;
  const extra = Math.max(0, energia - 1);
  const paso = 2.5;
  let puntos = '';
  let desde = 0;
  if (extra === 0) {
    puntos = `${cx.toFixed(1)},0 `;
    desde = Math.floor(calmaHasta / paso) * paso;
  }
  for (let y = desde; y <= alto; y += paso) {
    const t = y <= calmaHasta ? 0 : (y - calmaHasta) / tramo;
    const envolvente = Math.pow(t, 1.5) * 0.9 + extra * 0.3;
    const amp = Math.min(maxAmp, maxAmp * envolvente);
    const vaiven = Math.sin(y * 0.16 + 1.2) * 0.8 + Math.sin(y * 0.41 + 1.3) * 0.2;
    puntos += `${(cx + amp * vaiven).toFixed(1)},${y.toFixed(1)} `;
  }
  return puntos;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0 },
});
