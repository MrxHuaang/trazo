import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { color } from '@/theme';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

export type TraceNode = {
  /** Posición horizontal de 0 (inicio) a 1 (fin). */
  at: number;
  /** past: ya pasó · next: la próxima (cobalto) · scheduled: más tarde · pending: solicitada. */
  kind: 'past' | 'next' | 'scheduled' | 'pending';
};

type TraceLineProps = {
  height?: number;
  /** Qué tanto se agita el inicio de la línea (0 = plana, 1 = sismo). */
  agitation?: number;
  /** Fracción del ancho donde la línea ya está en calma. */
  calmFrom?: number;
  nodes?: TraceNode[];
  /** Anima la línea de agitada a calma al montarse (respeta "Reducir movimiento"). */
  animate?: boolean;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Trazo: línea de sismógrafo que empieza agitada y termina en calma.
 * Es la firma de la marca: línea del día en Hoy, carga, estados vacíos e ícono.
 */
export function TraceLine({
  height = 40,
  agitation = 1,
  calmFrom = 0.38,
  nodes = [],
  animate = true,
  strokeWidth = 1.8,
  style,
}: TraceLineProps) {
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();
  const energy = useSharedValue(animate && !reduceMotion ? 2.2 : 1);

  useEffect(() => {
    if (animate && !reduceMotion) {
      energy.set(withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    }
  }, [animate, reduceMotion, energy]);

  const animatedProps = useAnimatedProps(() => ({
    points: tracePoints(width, height, agitation * energy.get(), calmFrom),
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const mid = height / 2;
  const nodeRadius = Math.max(3.5, strokeWidth * 2);

  return (
    <View style={[{ height }, style]} onLayout={onLayout} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {width > 0 && (
        <Svg width={width} height={height}>
          <AnimatedPolyline
            points={tracePoints(width, height, agitation, calmFrom)}
            animatedProps={animatedProps}
            fill="none"
            stroke={color.ink}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {nodes.map((node, i) => {
            const cx = Math.min(width - nodeRadius - 1, Math.max(nodeRadius + 1, node.at * width));
            if (node.kind === 'pending') {
              return <Circle key={i} cx={cx} cy={mid} r={nodeRadius} fill={color.canvas} stroke={color.ink} strokeWidth={1.4} />;
            }
            if (node.kind === 'past') {
              return <Circle key={i} cx={cx} cy={mid} r={nodeRadius * 0.6} fill={color.inkSoft} />;
            }
            const r = node.kind === 'next' ? nodeRadius * 1.3 : nodeRadius;
            return <Circle key={i} cx={cx} cy={mid} r={r} fill={node.kind === 'next' ? color.accent : color.ink} />;
          })}
        </Svg>
      )}
    </View>
  );
}

/** Genera los puntos de la línea: oscilación amortiguada al inicio, calma después. */
function tracePoints(width: number, height: number, agitation: number, calmFrom: number) {
  'worklet';
  if (width <= 0) return '';
  const mid = height / 2;
  const maxAmp = Math.min(height / 2 - 2, (height / 2 - 2) * 0.9 * agitation);
  const step = 2.5;
  const calmX = Math.max(1, width * calmFrom);
  let points = '';
  for (let x = 0; x <= width; x += step) {
    const t = Math.min(x / calmX, 1);
    const envelope = Math.pow(1 - t, 1.6);
    const wobble = Math.sin(x * 0.16 + 1.2) * 0.8 + Math.sin(x * 0.41 + 1.3) * 0.2;
    const y = mid + maxAmp * envelope * wobble;
    points += `${x.toFixed(1)},${y.toFixed(2)} `;
  }
  return points;
}
