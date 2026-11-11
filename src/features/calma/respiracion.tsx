import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { cn } from '@/lib/cn';
import { Aparecer, Button, Text, TraceLine } from '@/ui';

import { CICLO, CICLOS, DURACION_FASE, momento, NOMBRE_FASE, TOTAL } from './ritmo';
import { TrazoRespiracion, VENTANA } from './trazo-respiracion';

type Estado = 'listo' | 'respirando' | 'terminado';

const APARECE = FadeIn.duration(400).reduceMotion(ReduceMotion.System);

/**
 * Respiración guiada 4-4-6. El reloj es un SharedValue que avanza en el hilo de la interfaz; React
 * solo se entera una vez por segundo (fase, cuenta y ciclos), así la línea nunca tropieza.
 */
export function Respiracion() {
  const reducir = useReducedMotion();
  const tiempo = useSharedValue(0);
  const [estado, setEstado] = useState<Estado>('listo');
  const [segundo, setSegundo] = useState(0);
  const { ciclo, fase, cuenta } = momento(segundo);

  // El reloj avanza en el hilo de la interfaz; la pantalla se actualiza solo al cambiar de segundo.
  useAnimatedReaction(
    () => Math.floor(tiempo.get()),
    (actual, anterior) => {
      if (actual !== anterior) scheduleOnRN(setSegundo, actual);
    },
  );

  const terminar = () => {
    setEstado('terminado');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility('Listo. Cinco respiraciones completas.');
    // La pluma sigue unos segundos más para que el Trazo termine de aplanarse.
    tiempo.set(withTiming(TOTAL + VENTANA, { duration: VENTANA * 1000, easing: Easing.out(Easing.quad) }));
  };

  const empezar = () => {
    setSegundo(0);
    setEstado('respirando');
    tiempo.set(0);
    // Es un reloj, no un adorno: corre aunque esté activado "Reducir movimiento".
    tiempo.set(
      withTiming(TOTAL, { duration: TOTAL * 1000, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (fin) => {
        if (fin) scheduleOnRN(terminar);
      }),
    );
  };

  const detener = () => {
    cancelAnimation(tiempo);
    tiempo.set(0);
    setSegundo(0);
    setEstado('listo');
  };

  // Háptico leve y anuncio para lectores de pantalla en cada cambio de fase.
  useEffect(() => {
    if (estado !== 'respirando') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    AccessibilityInfo.announceForAccessibility(NOMBRE_FASE[fase]);
  }, [estado, fase, ciclo]);

  // Al cambiar de ejercicio o cerrar Calma, el reloj se detiene sin dar el ejercicio por terminado.
  useEffect(() => () => cancelAnimation(tiempo), [tiempo]);

  // Si la app se va a segundo plano, el ejercicio vuelve al inicio en vez de seguir sin nadie.
  useEffect(() => {
    if (estado !== 'respirando') return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') detener();
    });
    return () => sub.remove();
  });

  const completados = estado === 'terminado' ? CICLOS : ciclo;

  return (
    <View className="flex-1 justify-between">
      <View className="flex-1 justify-center gap-6">
        {estado === 'terminado' ? (
          <Animated.View entering={APARECE} className="gap-2 px-5">
            <Text variant="display" accessibilityRole="header">
              Listo
            </Text>
            <Text variant="bodyLarge" className="text-ink-soft">
              Cinco respiraciones completas. Quédate un momento así, sin prisa.
            </Text>
          </Animated.View>
        ) : estado === 'respirando' ? (
          <View className="flex-row items-end justify-between px-5" accessibilityLiveRegion="polite">
            <Text variant="display" className="text-[44px] leading-[48px]">
              {NOMBRE_FASE[fase]}
            </Text>
            <Text
              variant="number"
              className="font-mono text-ink-soft"
              accessibilityLabel={`${cuenta} de ${DURACION_FASE[fase]}`}>
              {cuenta}
            </Text>
          </View>
        ) : (
          <Aparecer orden={1} className="gap-2 px-5">
            <Text variant="display" accessibilityRole="header">
              Respira con el Trazo
            </Text>
            <Text variant="bodyLarge" className="text-ink-soft">
              Inhala mientras la línea sube, sostén arriba y suelta el aire mientras baja. Cuatro, cuatro y seis
              segundos, cinco veces.
            </Text>
          </Aparecer>
        )}

        <Aparecer orden={2}>
          {reducir ? (
            // Versión estática: el texto de la fase y la cuenta guían sin movimiento.
            <TraceLine height={64} agitation={0} animate={false} />
          ) : (
            <TrazoRespiracion tiempo={tiempo} height={200} />
          )}
        </Aparecer>

        <Aparecer orden={3} className="gap-2 px-5">
          <View
            className="flex-row gap-1.5"
            accessibilityLabel={`${completados} de ${CICLOS} respiraciones`}
            accessibilityRole="progressbar">
            {Array.from({ length: CICLOS }, (_, i) => (
              <View
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  i < completados ? 'bg-ink' : i === completados && estado === 'respirando' ? 'bg-accent' : 'bg-line',
                )}
              />
            ))}
          </View>
          <Text variant="mono" className="text-ink-soft">
            {completados} de {CICLOS} respiraciones · {CICLO} s cada una
          </Text>
        </Aparecer>
      </View>

      <Aparecer orden={4} className="px-5 pb-4 pt-6">
        {estado === 'respirando' ? (
          <Button label="Detener" variant="secondary" onPress={detener} />
        ) : (
          <Button label={estado === 'terminado' ? 'Otra vez' : 'Empezar'} onPress={empezar} />
        )}
      </Aparecer>
    </View>
  );
}
