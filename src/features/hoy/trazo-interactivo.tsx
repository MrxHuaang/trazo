import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Text, TraceLine } from '@/ui';

import { puntoMasCercano, type PuntoDia } from './rules';

export const ALTO_TRAZO = 44;
export const ALTO_TRAZO_FINO = 20;
/** Al soltar a esta distancia (o menos) de un nodo se abre la cita. */
const RADIO_ABRIR = 28;
const ANCHO_ETIQUETA = 168;

type TrazoInteractivoProps = {
  puntos: PuntoDia[];
  /** 0 = encabezado abierto (Trazo completo), 1 = colapsado (barra fina). */
  colapso: SharedValue<number>;
  onAbrir: (citaId: string) => void;
};

/**
 * La línea del día, tocable: al arrastrar el dedo muestra la cita más cercana (hora y nombre corto)
 * con un tic háptico al pasar por cada nodo; al soltar sobre una cita, abre su detalle.
 * Al hacer scroll se encoge a una barra fina que conserva los nodos.
 */
export function TrazoInteractivo({ puntos, colapso, onAbrir }: TrazoInteractivoProps) {
  const [ancho, setAncho] = useState(0);
  const [activo, setActivo] = useState<PuntoDia | null>(null);
  // Último nodo bajo el dedo y qué tan cerca está (solo se leen en los eventos del gesto).
  const ultimo = useRef<{ id: string; distancia: number } | null>(null);

  function mover(x: number) {
    const cercano = puntoMasCercano(puntos, x, ancho);
    if (!cercano) return;
    if (ultimo.current?.id !== cercano.punto.id) {
      void Haptics.selectionAsync();
      setActivo(cercano.punto);
    }
    ultimo.current = { id: cercano.punto.id, distancia: cercano.distancia };
  }

  // También cuenta un toque quieto sobre un nodo (el gesto termina sin haberse movido).
  function soltar() {
    const final = ultimo.current;
    ultimo.current = null;
    setActivo(null);
    if (final && final.distancia <= RADIO_ABRIR) onAbrir(final.id);
  }

  const gesto = usePanGesture({
    runOnJS: true,
    enabled: puntos.length > 0 && ancho > 0,
    minDistance: 0,
    hitSlop: { top: 10, bottom: 14 },
    onBegin: (e) => mover(e.x),
    onUpdate: (e) => mover(e.x),
    onFinalize: () => soltar(),
  });

  const alto = useAnimatedStyle(() => ({
    height: interpolate(colapso.get(), [0, 1], [ALTO_TRAZO, ALTO_TRAZO_FINO], Extrapolation.CLAMP),
  }));
  const completo = useAnimatedStyle(() => ({
    opacity: interpolate(colapso.get(), [0, 0.6], [1, 0], Extrapolation.CLAMP),
  }));
  const fino = useAnimatedStyle(() => ({
    opacity: interpolate(colapso.get(), [0.4, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const izquierda = activo ? Math.max(0, Math.min(ancho - ANCHO_ETIQUETA, activo.at * ancho - ANCHO_ETIQUETA / 2)) : 0;

  return (
    <View>
      <GestureDetector gesture={gesto}>
        <Animated.View style={alto} onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))}>
          <Animated.View style={completo} className="absolute left-0 right-0 top-0">
            <TraceLine height={ALTO_TRAZO} nodes={puntos} />
          </Animated.View>
          <Animated.View style={fino} className="absolute left-0 right-0 top-0">
            <TraceLine height={ALTO_TRAZO_FINO} agitation={0.3} calmFrom={0.14} strokeWidth={1.4} animate={false} nodes={puntos} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      {activo ? (
        <Animated.View
          pointerEvents="none"
          entering={FadeIn.duration(120).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}
          className="absolute top-full z-10 mt-1 flex-row items-center justify-center gap-2 rounded-full bg-ink px-3 py-2"
          style={{ left: izquierda, width: ANCHO_ETIQUETA }}
          accessibilityLiveRegion="polite">
          <Text variant="mono" className="text-accent-on">
            {activo.hora}
          </Text>
          <Text variant="label" className="shrink text-accent-on" numberOfLines={1}>
            {activo.nombre}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
