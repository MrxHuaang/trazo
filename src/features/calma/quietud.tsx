import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import Animated, {
  FadeIn,
  ReduceMotion,
  useAnimatedReaction,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useEstadoApp } from '@/features/acceso/use-estado-app';
import { Aparecer, Button, Text, TraceLine } from '@/ui';

import { AnilloQuietud } from './anillo-quietud';
import { avanceQuietud, META_QUIETUD } from './quietud-reglas';
import { useSismografo } from './use-sismografo';

type Estado = 'listo' | 'midiendo' | 'logrado';

const APARECE = FadeIn.duration(400).reduceMotion(ReduceMotion.System);
/** Paso máximo por cuadro, en segundos: si el teléfono se traba, el progreso no da saltos. */
const PASO_MAXIMO = 0.1;

type QuietudProps = {
  /** La pantalla está a la vista: solo así se escucha el acelerómetro. */
  visible: boolean;
};

/**
 * Quietud: sostener el teléfono quieto hasta juntar 30 segundos de calma. El Trazo muestra el
 * movimiento real (sismógrafo) y el anillo se llena con la calma. Si el teléfono se mueve, el anillo
 * retrocede despacio; no hay mensajes de error ni de "fallaste", solo la línea que vuelve a aquietarse.
 */
export function Quietud({ visible }: QuietudProps) {
  const reducir = useReducedMotion();
  const [estado, setEstado] = useState<Estado>('listo');
  const [segundos, setSegundos] = useState(0);
  const progreso = useSharedValue(0);
  const avisado = useSharedValue(false);
  const { energia, disponible } = useSismografo({ activo: visible && estado !== 'logrado' });
  const sinSensor = disponible === false;
  const estadoApp = useEstadoApp();

  const lograr = () => {
    setEstado('logrado');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility('Listo. Treinta segundos de quietud.');
  };

  // Cuadro a cuadro, en el hilo de la interfaz: la energía del sensor decide si el anillo avanza o retrocede.
  const reloj = useFrameCallback(({ timeSincePreviousFrame }) => {
    if (avisado.get()) return;
    const dt = Math.min((timeSincePreviousFrame ?? 0) / 1000, PASO_MAXIMO);
    const nuevo = avanceQuietud(progreso.get(), energia.get(), dt);
    progreso.set(nuevo);
    if (nuevo >= META_QUIETUD) {
      avisado.set(true);
      scheduleOnRN(lograr);
    }
  }, false);

  // El reloj corre solo midiendo y con la pantalla a la vista: sin sensor no se suma calma a ciegas.
  const corre = estado === 'midiendo' && visible && estadoApp === 'active';
  useEffect(() => {
    reloj.setActive(corre);
  }, [corre, reloj]);

  // React solo se entera de los segundos enteros (texto, lector de pantalla y versión sin movimiento).
  useAnimatedReaction(
    () => Math.floor(progreso.get()),
    (actual, anterior) => {
      if (actual !== anterior) scheduleOnRN(setSegundos, actual);
    },
  );

  const volverAEmpezar = (siguiente: Estado) => {
    progreso.set(0);
    avisado.set(false);
    setSegundos(0);
    setEstado(siguiente);
  };
  const empezar = () => volverAEmpezar('midiendo');
  const reiniciar = () => volverAEmpezar('listo');

  // Si la app se va a segundo plano, el ejercicio vuelve al inicio en vez de esperar a nadie.
  useEffect(() => {
    if (estado !== 'midiendo') return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') reiniciar();
    });
    return () => sub.remove();
  });

  const restantes = META_QUIETUD - segundos;

  return (
    <View className="flex-1 justify-between">
      <View className="flex-1 justify-center gap-6">
        {estado === 'logrado' ? (
          <Animated.View entering={APARECE} className="gap-2 px-5">
            <Text variant="display" accessibilityRole="header">
              Listo
            </Text>
            <Text variant="bodyLarge" className="text-ink-soft">
              Treinta segundos de quietud. Nota cómo quedó la respiración, sin cambiarla.
            </Text>
          </Animated.View>
        ) : (
          <Aparecer orden={1} className="gap-2 px-5">
            <Text variant="display" accessibilityRole="header">
              Quietud
            </Text>
            <Text variant="bodyLarge" className="text-ink-soft">
              {sinSensor
                ? 'Este teléfono no tiene sensor de movimiento, así que no puede acompañar este ejercicio. La respiración guiada funciona igual.'
                : estado === 'midiendo'
                  ? 'Sostén el teléfono con las dos manos, apoya los codos si puedes y deja que la línea se aquiete.'
                  : 'Sostén el teléfono quieto, con las dos manos. La línea muestra tu movimiento; el anillo se llena con treinta segundos de calma.'}
            </Text>
          </Aparecer>
        )}

        {!sinSensor && (
          <Aparecer orden={2} className="items-center gap-5">
            <AnilloQuietud progreso={progreso} estatico={reducir ? segundos : undefined}>
              <View
                className="items-center"
                accessibilityRole="progressbar"
                accessibilityLabel={`${segundos} de ${META_QUIETUD} segundos de quietud`}>
                <Text variant="number" className="font-mono">
                  {estado === 'logrado' ? META_QUIETUD : segundos}
                </Text>
                <Text variant="caption" className="text-ink-soft">
                  de {META_QUIETUD} s
                </Text>
              </View>
            </AnilloQuietud>

            {/* Sismógrafo de borde a borde. Con "Reducir movimiento" queda plano y guían la cuenta y el texto. */}
            <View className="self-stretch">
              {reducir || estado === 'logrado' ? (
                <TraceLine height={72} agitation={0} calmFrom={1} strokeWidth={2.2} animate={false} />
              ) : (
                <TraceLine height={72} agitation={0.03} calmFrom={1} strokeWidth={2.2} animate={false} energia={energia} />
              )}
            </View>

            {estado === 'midiendo' && (
              <Text variant="mono" className="text-ink-soft">
                {restantes === 1 ? 'Falta 1 segundo' : `Faltan ${restantes} segundos`}
              </Text>
            )}
          </Aparecer>
        )}
      </View>

      <Aparecer orden={3} className="px-5 pb-4 pt-6">
        {estado === 'midiendo' ? (
          <Button label="Detener" variant="secondary" onPress={reiniciar} />
        ) : (
          <Button
            label={estado === 'logrado' ? 'Otra vez' : 'Empezar'}
            onPress={empezar}
            disabled={sinSensor || disponible === null}
          />
        )}
      </Aparecer>
    </View>
  );
}
