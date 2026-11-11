import * as Haptics from 'expo-haptics';
import { useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { Text } from '@/ui';

export type AccionDeslizar = {
  etiqueta: string;
  icono: ReactNode;
  onAccion: () => void;
};

type FilaDeslizableProps = {
  children: ReactNode;
  /** Acción al deslizar hacia la derecha (aparece a la izquierda de la fila). */
  derecha?: AccionDeslizar;
  /** Acción al deslizar hacia la izquierda (aparece a la derecha de la fila). */
  izquierda?: AccionDeslizar;
  /** Fondo de la fila; debe ser opaco para tapar las acciones. */
  className?: string;
};

/** Distancia que confirma la acción al soltar. */
const UMBRAL = 84;
const TOPE = 128;
const RESORTE = { damping: 24, stiffness: 280, mass: 0.7 };

/**
 * Fila que se desliza para actuar: a la derecha una acción (menta), a la izquierda otra (lavanda).
 * Al cruzar el umbral da un toque háptico; al soltar pasado el umbral ejecuta la acción y vuelve a su sitio.
 * Los gestos son un atajo: la fila conserva sus botones visibles.
 */
export function FilaDeslizable({ children, derecha, izquierda, className }: FilaDeslizableProps) {
  const x = useSharedValue(0);
  // Lado cuyo umbral ya se cruzó en el gesto en curso (1 derecha, -1 izquierda).
  const cruzado = useRef(0);

  const gesto = usePanGesture({
    runOnJS: true,
    enabled: !!derecha || !!izquierda,
    activeOffsetX: [-14, 14],
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      const permitido = e.translationX > 0 ? !!derecha : !!izquierda;
      // Sin acción en ese lado, la fila apenas cede: se entiende que no hay nada que hacer.
      const dx = permitido
        ? Math.max(-TOPE, Math.min(TOPE, e.translationX))
        : Math.max(-14, Math.min(14, e.translationX * 0.12));
      x.set(dx);
      const lado = dx >= UMBRAL ? 1 : dx <= -UMBRAL ? -1 : 0;
      if (lado !== cruzado.current) {
        cruzado.current = lado;
        if (lado !== 0) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onDeactivate: (e) => {
      const lado = cruzado.current;
      cruzado.current = 0;
      x.set(withSpring(0, RESORTE));
      if (e.canceled) return;
      if (lado === 1) derecha?.onAccion();
      if (lado === -1) izquierda?.onAccion();
    },
  });

  const frente = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const fondoDerecha = useAnimatedStyle(() => ({ opacity: interpolate(x.get(), [0, 24], [0, 1], Extrapolation.CLAMP) }));
  const fondoIzquierda = useAnimatedStyle(() => ({ opacity: interpolate(x.get(), [-24, 0], [1, 0], Extrapolation.CLAMP) }));
  const marcaDerecha = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(x.get(), [0, UMBRAL], [0.7, 1.08], Extrapolation.CLAMP) }],
  }));
  const marcaIzquierda = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(x.get(), [-UMBRAL, 0], [1.08, 0.7], Extrapolation.CLAMP) }],
  }));

  return (
    <GestureDetector gesture={gesto}>
      <View>
        {derecha ? (
          <Animated.View
            style={fondoDerecha}
            className="absolute inset-0 flex-row items-center bg-menta px-4"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants">
            <Animated.View style={marcaDerecha} className="flex-row items-center gap-2">
              {derecha.icono}
              <Text variant="label" className="text-menta-ink">
                {derecha.etiqueta}
              </Text>
            </Animated.View>
          </Animated.View>
        ) : null}
        {izquierda ? (
          <Animated.View
            style={fondoIzquierda}
            className="absolute inset-0 flex-row items-center justify-end bg-lavanda px-4"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants">
            <Animated.View style={marcaIzquierda} className="flex-row items-center gap-2">
              <Text variant="label" className="text-lavanda-ink">
                {izquierda.etiqueta}
              </Text>
              {izquierda.icono}
            </Animated.View>
          </Animated.View>
        ) : null}
        <Animated.View style={frente} className={cn('bg-canvas', className)}>
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
