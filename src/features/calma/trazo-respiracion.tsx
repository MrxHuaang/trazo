import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { color } from '@/theme';

import { nivelRespiracion } from './ritmo';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Fracción del ancho donde va la pluma: a su izquierda lo ya respirado, a su derecha lo que viene. */
const PLUMA = 0.62;
/** Segundos de historia que caben a la izquierda de la pluma. */
export const VENTANA = 9;
const MARGEN = 12;
const PASO = 3;

type TrazoRespiracionProps = {
  /** Segundos transcurridos del ejercicio (continuo, en el hilo de la interfaz). */
  tiempo: SharedValue<number>;
  height?: number;
};

/**
 * El Trazo como guía de respiración: el papel avanza de derecha a izquierda y la pluma sube al
 * inhalar, se sostiene arriba y baja al exhalar. La línea tenue de la derecha muestra lo que viene,
 * para que la respiración pueda anticiparse a la línea en vez de perseguirla.
 */
export function TrazoRespiracion({ tiempo, height = 200 }: TrazoRespiracionProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const pluma = width * PLUMA;

  const pasado = useAnimatedProps(() => ({ points: puntos(width, height, tiempo.get(), 0, pluma) }));
  const futuro = useAnimatedProps(() => ({ points: puntos(width, height, tiempo.get(), pluma, width) }));
  const punta = useAnimatedProps(() => ({ cy: altura(height, tiempo.get()) }));

  return (
    <View style={{ height }} onLayout={onLayout} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {width > 0 && (
        <Svg width={width} height={height}>
          <AnimatedPolyline
            points={puntos(width, height, 0, pluma, width)}
            animatedProps={futuro}
            fill="none"
            stroke={color.line}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <AnimatedPolyline
            points={puntos(width, height, 0, 0, pluma)}
            animatedProps={pasado}
            fill="none"
            stroke={color.ink}
            strokeWidth={2.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <AnimatedCircle cx={pluma} cy={altura(height, 0)} r={7} fill={color.accent} animatedProps={punta} />
        </Svg>
      )}
    </View>
  );
}

/** Posición vertical de la línea en el instante `t`. */
function altura(height: number, t: number) {
  'worklet';
  const base = height - MARGEN;
  return base - nivelRespiracion(t) * (base - MARGEN);
}

/** Puntos de la línea entre `desde` y `hasta` (en píxeles) cuando el ejercicio va en el segundo `t`. */
function puntos(width: number, height: number, t: number, desde: number, hasta: number) {
  'worklet';
  if (width <= 0) return '';
  const pluma = width * PLUMA;
  const velocidad = pluma / VENTANA;
  let texto = '';
  for (let x = desde; x < hasta; x += PASO) {
    texto += `${x.toFixed(1)},${altura(height, t + (x - pluma) / velocidad).toFixed(2)} `;
  }
  // El último punto cae exacto en el borde para que las dos líneas se toquen en la pluma.
  texto += `${hasta.toFixed(1)},${altura(height, t + (hasta - pluma) / velocidad).toFixed(2)}`;
  return texto;
}
