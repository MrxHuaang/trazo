import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { CitaConPaciente } from '@/domain/types';
import { cn } from '@/lib/cn';
import { color } from '@/theme';
import { Text } from '@/ui';

import { CitaBloque } from './cita-bloque';
import { aHora, esActiva, PASO_ARRASTRE } from './rules';

const RESORTE = { damping: 20, stiffness: 240, mass: 0.7 };
/** Vuelve a su sitio con un rebote corto: dice "aquí no" sin sobresaltar. */
const REBOTE = { damping: 9, stiffness: 190, mass: 0.7 };
const ESPERA_MS = 300;

/** Sombra tenue solo mientras la cita está levantada (el resto de la app no usa sombras). */
const SOMBRA = {
  shadowColor: color.ink,
  shadowOpacity: 0.18,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

type Props = {
  cita: CitaConPaciente;
  /** Minuto de inicio dentro del día. */
  ini: number;
  /** Posición vertical (px) y alto del bloque en la línea de tiempo. */
  top: number;
  alto: number;
  /** Columna cuando hay bloques que se cruzan. */
  col: number;
  cols: number;
  /** Píxeles por minuto de la línea de tiempo. */
  pxMin: number;
  /** Cuántos minutos puede subir o bajar sin salirse de la ventana visible. */
  minMinutos: number;
  maxMinutos: number;
  /** Desplazamiento del scroll de la agenda: el bloque sigue al dedo aunque la lista se mueva sola. */
  scrollOffset: SharedValue<number>;
  /** Posición del dedo en pantalla mientras se arrastra (-1 en reposo), para el scroll automático. */
  dedoY: SharedValue<number>;
  onPress: () => void;
  onArrastre: (activo: boolean) => void;
  /** Recibe los minutos de diferencia. Resuelve false si no se pudo mover (el bloque rebota a su sitio). */
  onSoltar: (minutos: number) => Promise<boolean>;
};

/**
 * Cita de la línea de tiempo que se puede reprogramar arrastrándola: se mantiene presionada,
 * se levanta, sigue al dedo en pasos de 15 min con un tic por paso y muestra la hora destino.
 * La alternativa sin gesto es el panel Reprogramar del detalle.
 */
export function CitaArrastrable({
  cita,
  ini,
  top,
  alto,
  col,
  cols,
  pxMin,
  minMinutos,
  maxMinutos,
  scrollOffset,
  dedoY,
  onPress,
  onArrastre,
  onSoltar,
}: Props) {
  const reducir = useReducedMotion();
  const movible = esActiva(cita);
  const pxPaso = PASO_ARRASTRE * pxMin;
  const minPx = minMinutos * pxMin;
  const maxPx = maxMinutos * pxMin;

  const base = useSharedValue(top);
  const dedo = useSharedValue(0);
  const scrollInicio = useSharedValue(0);
  const activo = useSharedValue(false);
  /** Desplazamiento que conserva el bloque al soltarlo, hasta que llega la cita actualizada. */
  const fijo = useSharedValue(0);
  const levante = useSharedValue(0);

  const [levantada, setLevantada] = useState(false);
  const [pasos, setPasos] = useState(0);
  const recienArrastrada = useRef(false);

  // Cuando cambia la hora (por arrastre, panel o deshacer) el bloque viaja desde donde se ve hasta su nuevo lugar.
  useEffect(() => {
    const visible = base.get() + fijo.get();
    fijo.set(0);
    base.set(visible);
    base.set(reducir ? top : withSpring(top, RESORTE));
  }, [top, base, fijo, reducir]);

  const alLevantar = () => {
    recienArrastrada.current = true;
    setPasos(0);
    setLevantada(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onArrastre(true);
  };

  const alCambiarPaso = (p: number) => {
    void Haptics.selectionAsync();
    setPasos(p);
  };

  const alSoltar = async (p: number) => {
    setLevantada(false);
    onArrastre(false);
    setTimeout(() => {
      recienArrastrada.current = false;
    }, 250);
    if (p === 0) return;
    const movida = await onSoltar(p * PASO_ARRASTRE);
    if (!movida) fijo.set(reducir ? 0 : withSpring(0, REBOTE));
  };

  const pan = usePanGesture({
    enabled: movible,
    activateAfterLongPress: ESPERA_MS,
    onActivate: () => {
      'worklet';
      scrollInicio.set(scrollOffset.get());
      dedo.set(0);
      activo.set(true);
      levante.set(withSpring(1, RESORTE));
      scheduleOnRN(alLevantar);
    },
    onUpdate: (e) => {
      'worklet';
      dedo.set(e.translationY);
      dedoY.set(e.absoluteY);
    },
    onDeactivate: (e) => {
      'worklet';
      const dy = clamp(dedo.get() + scrollOffset.get() - scrollInicio.get(), minPx, maxPx);
      const p = e.canceled ? 0 : Math.round(dy / pxPaso);
      fijo.set(dy);
      activo.set(false);
      dedoY.set(-1);
      levante.set(withSpring(0, RESORTE));
      fijo.set(withSpring(p * pxPaso, RESORTE));
      scheduleOnRN(alSoltar, p);
    },
  });

  // Un tic por cada paso de 15 min que cruza el bloque (también cuando la lista se desplaza sola).
  useAnimatedReaction(
    () => (activo.get() ? Math.round(clamp(dedo.get() + scrollOffset.get() - scrollInicio.get(), minPx, maxPx) / pxPaso) : null),
    (p, previo) => {
      if (p !== null && previo !== null && previo !== undefined && p !== previo) scheduleOnRN(alCambiarPaso, p);
    },
  );

  const estilo = useAnimatedStyle(() => {
    const dy = activo.get() ? clamp(dedo.get() + scrollOffset.get() - scrollInicio.get(), minPx, maxPx) : fijo.get();
    return {
      top: base.get(),
      zIndex: levante.get() > 0.01 ? 20 : 0,
      transform: [{ translateY: dy }, { scale: 1 + levante.get() * 0.03 }],
    };
  });

  const posicion = { left: `${(col / cols) * 100}%`, width: `${100 / cols}%` } as const;

  return (
    <>
      {levantada ? (
        <View
          pointerEvents="none"
          className="absolute px-px"
          style={[posicion, { top, height: alto }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <View className="flex-1 rounded-field border border-dashed border-ink-soft" />
        </View>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View
          className="absolute px-px"
          style={[posicion, { height: alto }, estilo]}
          entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(160).reduceMotion(ReduceMotion.System)}>
          <View className={cn('flex-1 rounded-field', levantada && 'bg-canvas')} style={levantada ? SOMBRA : undefined}>
            <CitaBloque
              cita={cita}
              alto={alto}
              onPress={() => {
                if (!recienArrastrada.current) onPress();
              }}
            />
          </View>
          {levantada ? (
            <View
              pointerEvents="none"
              className="absolute right-full top-0 mr-1 rounded-full bg-ink px-1.5 py-0.5"
              accessibilityLiveRegion="polite">
              <Text variant="mono" className="text-accent-on">
                {aHora(ini + pasos * PASO_ARRASTRE)}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </>
  );
}
