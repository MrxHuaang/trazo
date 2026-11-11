import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { color } from '@/theme';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type TraceNode = {
  /** Posición horizontal de 0 (inicio) a 1 (fin). */
  at: number;
  /** past: ya pasó · next: la próxima (cobalto, con pulso) · scheduled: más tarde · pending: solicitada. */
  kind: 'past' | 'next' | 'scheduled' | 'pending';
};

type TraceLineProps = {
  height?: number;
  /** Qué tanto se agita el inicio de la línea (0 = plana, 1 = sismo). */
  agitation?: number;
  /** Fracción del ancho donde la línea ya está en calma. 1 = agitada de punta a punta. */
  calmFrom?: number;
  nodes?: TraceNode[];
  /** Anima la línea de agitada a calma al montarse (respeta "Reducir movimiento"). */
  animate?: boolean;
  /**
   * Energía externa en vivo (0 = calma, 1 = sismo): se suma a `agitation`. Con ella la línea
   * también se desplaza, como el papel de un sismógrafo. La usan el acelerómetro y el ejercicio de calma.
   */
  energia?: SharedValue<number>;
  strokeWidth?: number;
  stroke?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Trazo: línea de sismógrafo que empieza agitada y termina en calma.
 * Es la firma de la marca: línea del día en Hoy, carga, estados vacíos, bloqueo e ícono.
 */
export function TraceLine({
  height = 40,
  agitation = 1,
  calmFrom = 0.38,
  nodes = [],
  animate = true,
  energia,
  strokeWidth = 1.8,
  stroke = color.ink,
  className,
  style,
}: TraceLineProps) {
  const [width, setWidth] = useState(0);
  // El ancho también vive en el hilo de la interfaz: así el worklet nunca se queda con un ancho viejo (0).
  const ancho = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const arranque = useSharedValue(animate && !reduceMotion ? 2.2 : 1);
  const fase = useSharedValue(0);
  const pulso = useSharedValue(0);
  const hayProxima = nodes.some((n) => n.kind === 'next');
  const enVivo = energia !== undefined;

  useEffect(() => {
    if (animate && !reduceMotion) {
      arranque.set(withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    }
  }, [animate, reduceMotion, arranque]);

  // El papel del sismógrafo avanza solo cuando hay energía en vivo.
  useEffect(() => {
    if (!enVivo || reduceMotion) return;
    fase.set(withRepeat(withTiming(Math.PI * 40, { duration: 60_000, easing: Easing.linear }), -1, false));
    return () => fase.set(0);
  }, [enVivo, reduceMotion, fase]);

  // Pulso de la próxima cita: una onda que sale del punto cobalto cada 2,4 s.
  useEffect(() => {
    if (!hayProxima || reduceMotion) return;
    pulso.set(withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false));
    return () => pulso.set(0);
  }, [hayProxima, reduceMotion, pulso]);

  const animatedProps = useAnimatedProps(() => ({
    points: tracePoints(ancho.get(), height, agitation * arranque.get() + (energia ? energia.get() : 0), calmFrom, fase.get()),
  }));

  const mid = height / 2;
  const nodeRadius = Math.max(3.5, strokeWidth * 2);
  const pulsoProps = useAnimatedProps(() => ({
    r: nodeRadius * 1.3 + pulso.get() * nodeRadius * 2.6,
    opacity: 0.35 * (1 - pulso.get()),
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    ancho.set(w);
    setWidth(w);
  };
  const posicion = (at: number) => Math.min(width - nodeRadius * 4, Math.max(nodeRadius * 4, at * width));

  return (
    <View
      className={className}
      style={[{ height }, style]}
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {width > 0 && (
        <Svg width={width} height={height}>
          <AnimatedPolyline
            points={tracePoints(width, height, agitation, calmFrom, 0)}
            animatedProps={animatedProps}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {nodes.map((node, i) => {
            const cx = posicion(node.at);
            if (node.kind === 'pending') {
              return <Circle key={i} cx={cx} cy={mid} r={nodeRadius} fill={color.canvas} stroke={color.ink} strokeWidth={1.4} />;
            }
            if (node.kind === 'past') {
              return <Circle key={i} cx={cx} cy={mid} r={nodeRadius * 0.6} fill={color.inkSoft} />;
            }
            if (node.kind === 'next') {
              return (
                <AnimatedCircle key={`pulso-${i}`} cx={cx} cy={mid} r={nodeRadius * 1.3} fill={color.accent} animatedProps={pulsoProps} />
              );
            }
            return <Circle key={i} cx={cx} cy={mid} r={nodeRadius} fill={color.ink} />;
          })}
          {nodes.map((node, i) =>
            node.kind === 'next' ? <Circle key={`n-${i}`} cx={posicion(node.at)} cy={mid} r={nodeRadius * 1.3} fill={color.accent} /> : null,
          )}
        </Svg>
      )}
    </View>
  );
}

/** Genera los puntos de la línea: oscilación amortiguada al inicio, calma después. */
function tracePoints(width: number, height: number, agitation: number, calmFrom: number, fase: number) {
  'worklet';
  if (width <= 0) return '';
  const mid = height / 2;
  const tope = height / 2 - 2;
  const maxAmp = Math.min(tope, tope * 0.9 * Math.max(agitation, 0));
  const step = 2.5;
  const calmX = Math.max(1, width * calmFrom);
  let points = '';
  for (let x = 0; x <= width; x += step) {
    const t = Math.min(x / calmX, 1);
    const envelope = calmFrom >= 1 ? 1 : Math.pow(1 - t, 1.6);
    const wobble = Math.sin(x * 0.16 + 1.2 + fase) * 0.8 + Math.sin(x * 0.41 + 1.3 + fase * 1.7) * 0.2;
    const y = mid + maxAmp * envelope * wobble;
    points += `${x.toFixed(1)},${y.toFixed(2)} `;
  }
  return points;
}
