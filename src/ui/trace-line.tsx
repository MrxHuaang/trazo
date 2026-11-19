import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { color } from '@/theme';

export type TraceNode = {
  /** 0 a 1 sobre el ancho. */
  at: number;
  /** next es la próxima cita (lleva pulso); pending es una solicitada sin confirmar. */
  kind: 'past' | 'next' | 'scheduled' | 'pending';
};

type TraceLineProps = {
  height?: number;
  /** 0 = plana, 1 = sismo. */
  agitation?: number;
  /** Fracción del ancho desde la que la línea queda en calma (1 = agitada de punta a punta). */
  calmFrom?: number;
  nodes?: TraceNode[];
  /** Arranca agitada y se calma al montar. */
  animate?: boolean;
  /** Energía en vivo del acelerómetro; se suma a agitation y hace correr la línea como papel de sismógrafo. */
  energia?: SharedValue<number>;
  strokeWidth?: number;
  stroke?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

const ARRANQUE_MS = 1400;
// ~30 fps: los puntos se recalculan en JS y a 60 no se nota la diferencia.
const CADA_MS = 32;

/**
 * Línea de sismógrafo que arranca agitada y termina en calma.
 * Los puntos se calculan en JS porque los animatedProps de react-native-svg no se actualizaban con esta versión de Reanimated.
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
  const reduceMotion = useReducedMotion();
  const enVivo = energia !== undefined && !reduceMotion;
  const conArranque = animate && !reduceMotion;
  const [puntos, setPuntos] = useState('');

  useEffect(() => {
    // Sin movimiento no hace falta el bucle; el render pinta la línea estática.
    if (width <= 0 || (!conArranque && !enVivo)) return;
    let cuadro = 0;
    let ultimo = 0;
    const inicio = Date.now();
    const paso = () => {
      const ahora = Date.now();
      const t = ahora - inicio;
      if (ahora - ultimo >= CADA_MS) {
        ultimo = ahora;
        const avance = conArranque ? Math.min(t / ARRANQUE_MS, 1) : 1;
        const arranque = 1 + 1.2 * Math.pow(1 - avance, 3);
        const extra = energia ? energia.get() : 0;
        const fase = enVivo ? (t / 60_000) * Math.PI * 40 : 0;
        setPuntos(tracePoints(width, height, agitation * arranque + extra, calmFrom, fase));
        if (!enVivo && avance >= 1) return; // terminó el arranque y no hay sensor: se corta el bucle
      }
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [width, height, agitation, calmFrom, conArranque, enVivo, energia]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const mid = height / 2;
  const nodeRadius = Math.max(3.5, strokeWidth * 2);
  const posicion = (at: number) => Math.min(width - nodeRadius * 4, Math.max(nodeRadius * 4, at * width));
  const proxima = nodes.find((n) => n.kind === 'next');

  return (
    <View
      className={className}
      style={[{ height }, style]}
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {width > 0 && (
        <>
          {proxima ? <Pulso x={posicion(proxima.at)} y={mid} radio={nodeRadius * 1.3} activo={!reduceMotion} /> : null}
          <Svg width={width} height={height}>
            <Polyline
              points={(conArranque || enVivo) && puntos ? puntos : tracePoints(width, height, agitation, calmFrom, 0)}
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
                return <Circle key={i} cx={cx} cy={mid} r={nodeRadius * 1.3} fill={color.accent} />;
              }
              return <Circle key={i} cx={cx} cy={mid} r={nodeRadius} fill={color.ink} />;
            })}
          </Svg>
        </>
      )}
    </View>
  );
}

// Pulso de la próxima cita. Es el único bucle permitido en la interfaz.
function Pulso({ x, y, radio, activo }: { x: number; y: number; radio: number; activo: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!activo) return;
    p.set(withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false));
    return () => p.set(0);
  }, [activo, p]);
  const estilo = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - p.get()),
    transform: [{ scale: 1 + p.get() * 2 }],
  }));
  if (!activo) return null;
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-full bg-accent"
      style={[{ left: x - radio, top: y - radio, width: radio * 2, height: radio * 2 }, estilo]}
    />
  );
}

// Dos senos de distinta frecuencia para que no se vea como una onda perfecta, con una envolvente que se apaga en calmFrom.
function tracePoints(width: number, height: number, agitation: number, calmFrom: number, fase: number) {
  if (width <= 0) return '';
  const mid = height / 2;
  const tope = height / 2 - 2;
  // Si el sensor manda NaN o Infinity, la polyline entera deja de pintarse.
  const segura = Number.isFinite(agitation) ? Math.max(agitation, 0) : 0;
  const f = Number.isFinite(fase) ? fase : 0;
  const maxAmp = Math.min(tope, tope * 0.9 * segura);
  const step = 2.5;
  const calmX = Math.max(1, width * calmFrom);
  let points = '';
  for (let x = 0; x <= width; x += step) {
    const t = Math.min(x / calmX, 1);
    const envelope = calmFrom >= 1 ? 1 : Math.pow(1 - t, 1.6);
    const wobble = Math.sin(x * 0.16 + 1.2 + f) * 0.8 + Math.sin(x * 0.41 + 1.3 + f * 1.7) * 0.2;
    const y = mid + maxAmp * envelope * wobble;
    points += `${x.toFixed(1)},${y.toFixed(2)} `;
  }
  return points;
}
