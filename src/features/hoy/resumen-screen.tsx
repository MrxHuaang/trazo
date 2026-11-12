import * as Haptics from 'expo-haptics';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AccessibilityInfo, useWindowDimensions, View, type ViewStyle } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  useCompetingGestures,
  useLongPressGesture,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Carousel, type CarouselRef } from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hoyClave, inicioSemana } from '@/lib/dates';
import { color } from '@/theme';
import { Button, Text } from '@/ui';

import { BotonIcono } from './boton-icono';
import { volver } from './cabecera';
import { descripcionHistoria, Historia, HISTORIAS, type ClaveHistoria } from './historias';
import { useResumenSemana } from './hooks';
import { ProgresoHistorias } from './progreso-historias';
import { rangoSemana } from './rules';

/** Tiempo que se queda cada historia antes de pasar sola a la siguiente. */
const DURACION_MS = 6500;
/** Bajar el dedo esta distancia (o soltarlo rápido) cierra el resumen. */
const CIERRE_PX = 140;
const RESORTE = { damping: 22, stiffness: 240, mass: 0.8 };
const ULTIMA = HISTORIAS.length - 1;

/** Transición entre historias: la que sale se desliza, se aleja un poco y se apaga. */
function animacionHistoria(ancho: number) {
  return (valor: number): ViewStyle => {
    'worklet';
    const distancia = Math.abs(valor);
    return {
      transform: [
        { translateX: interpolate(valor, [-1, 0, 1], [-ancho, 0, ancho]) },
        { scale: interpolate(distancia, [0, 1], [1, 0.9], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(distancia, [0, 1], [1, 0.35], Extrapolation.CLAMP),
    };
  };
}

/**
 * Resumen de la semana en historias a pantalla completa: una por dato, con su bloque de color y la cifra gigante.
 * Tocar a la derecha avanza, a la izquierda retrocede, mantener pausa, deslizar hacia abajo cierra.
 * Avanza solo cada pocos segundos, salvo con "Reducir movimiento" o lector de pantalla.
 */
export function ResumenScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducir = useReducedMotion();
  const [lector, setLector] = useState(false);
  const [lunes] = useState(() => inicioSemana(hoyClave()));
  const { resumen } = useResumenSemana(lunes);
  const rango = rangoSemana(lunes);

  const carrusel = useRef<CarouselRef>(null);
  const [alto, setAlto] = useState(0);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const avance = useSharedValue(0);
  const bajada = useSharedValue(0);
  // Tiempo ya visto de la historia actual (para retomar tras una pausa).
  const transcurrido = useRef(0);
  const indiceDelReloj = useRef(-1);

  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setLector);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setLector);
    return () => sub.remove();
  }, []);

  function irA(destino: number, manual = true) {
    const n = Math.min(ULTIMA, Math.max(0, destino));
    if (n === indice) return;
    if (manual) void Haptics.selectionAsync();
    setIndice(n);
    carrusel.current?.scrollTo({ index: n, animated: !reducir });
  }

  const pasarSola = useEffectEvent(() => irA(indice + 1, false));

  const avanzaSola = !reducir && !lector && indice < ULTIMA;

  // Reloj de la historia actual: llena su segmento y pasa a la siguiente. Se detiene al pausar.
  useEffect(() => {
    if (indiceDelReloj.current !== indice) {
      indiceDelReloj.current = indice;
      transcurrido.current = 0;
    }
    if (!avanzaSola) {
      cancelAnimation(avance);
      avance.set(1);
      return;
    }
    if (pausado) {
      cancelAnimation(avance);
      return;
    }
    const restante = Math.max(0, DURACION_MS - transcurrido.current);
    avance.set(transcurrido.current / DURACION_MS);
    avance.set(withTiming(1, { duration: restante, easing: Easing.linear }));
    const inicio = Date.now();
    const reloj = setTimeout(() => pasarSola(), restante);
    return () => {
      clearTimeout(reloj);
      transcurrido.current += Date.now() - inicio;
      cancelAnimation(avance);
    };
  }, [indice, pausado, avanzaSola, avance]);

  const cerrarGesto = usePanGesture({
    runOnJS: true,
    activeOffsetY: 12,
    failOffsetX: [-16, 16],
    onActivate: () => setPausado(true),
    onUpdate: (e) => bajada.set(Math.max(0, e.translationY)),
    onDeactivate: (e) => {
      setPausado(false);
      if (!e.canceled && (e.translationY > CIERRE_PX || e.velocityY > 900)) {
        volver();
        return;
      }
      bajada.set(reducir ? 0 : withSpring(0, RESORTE));
    },
  });

  const deslizarGesto = usePanGesture({
    runOnJS: true,
    activeOffsetX: [-16, 16],
    failOffsetY: [-12, 12],
    onDeactivate: (e) => {
      if (e.canceled) return;
      if (e.translationX < -48 || e.velocityX < -700) irA(indice + 1);
      else if (e.translationX > 48 || e.velocityX > 700) irA(indice - 1);
    },
  });

  const mantenerGesto = useLongPressGesture({
    runOnJS: true,
    minDuration: 260,
    onActivate: () => setPausado(true),
    onFinalize: () => setPausado(false),
  });

  const tocarGesto = useTapGesture({
    runOnJS: true,
    maxDistance: 12,
    onActivate: (e) => irA(e.x < width * 0.3 ? indice - 1 : indice + 1),
  });

  const gesto = useCompetingGestures(cerrarGesto, deslizarGesto, mantenerGesto, tocarGesto);

  const arrastre = useAnimatedStyle(() => {
    const y = bajada.get();
    return {
      transform: [{ translateY: y }, { scale: interpolate(y, [0, 400], [1, 0.9], Extrapolation.CLAMP) }],
      borderRadius: interpolate(y, [0, 60], [0, 28], Extrapolation.CLAMP),
    };
  });

  const clave: ClaveHistoria = HISTORIAS[indice] ?? 'cierre';

  return (
    <GestureHandlerRootView>
      <Animated.View
        style={[arrastre, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}
        className="flex-1 overflow-hidden bg-canvas">
        <View className="flex-row items-center gap-2 pl-5 pr-2">
          <ProgresoHistorias total={HISTORIAS.length} actual={indice} avance={avance} />
          <BotonIcono etiqueta="Cerrar el resumen" onPress={volver} icono={<XIcon size={22} color={color.ink} />} />
        </View>

        <GestureDetector gesture={gesto}>
          <View
            className="flex-1"
            onLayout={(e) => setAlto(Math.round(e.nativeEvent.layout.height))}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`Resumen de la semana, historia ${indice + 1} de ${HISTORIAS.length}`}
            accessibilityValue={{ text: descripcionHistoria(clave, resumen) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => irA(e.nativeEvent.actionName === 'increment' ? indice + 1 : indice - 1)}>
            {alto > 0 ? (
              <Carousel
                ref={carrusel}
                style={{ width, height: alto }}
                data={HISTORIAS}
                scrollEnabled={false}
                loop={false}
                renderWindowSize={3}
                animation={{ type: 'spring', damping: 26, stiffness: 220, mass: 0.9 }}
                itemAnimation={animacionHistoria(width)}
                keyExtractor={(item) => item}
                renderItem={({ item, index }) => (
                  <View className="flex-1 px-3 pt-3">
                    <Historia clave={item} resumen={resumen} rango={rango} activa={index === indice} />
                  </View>
                )}
              />
            ) : null}
          </View>
        </GestureDetector>

        <View className="h-16 flex-row items-center justify-between px-3 pt-2">
          {indice === ULTIMA ? (
            <Button label="Volver a Hoy" onPress={volver} className="flex-1" />
          ) : (
            <>
              <BotonIcono
                etiqueta="Historia anterior"
                disabled={indice === 0}
                onPress={() => irA(indice - 1)}
                icono={<CaretLeftIcon size={22} color={color.ink} />}
              />
              <Text variant="caption" className="text-ink-soft">
                {pausado ? 'En pausa' : `${indice + 1} de ${HISTORIAS.length}`}
              </Text>
              <BotonIcono
                etiqueta="Historia siguiente"
                onPress={() => irA(indice + 1)}
                icono={<CaretRightIcon size={22} color={color.ink} />}
              />
            </>
          )}
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}
