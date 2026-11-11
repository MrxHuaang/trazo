import { Redirect, router, Stack, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConsultorio } from '@/data/hooks';
import { useSismografo } from './use-sismografo';
import { Aparecer, Button, Text, TraceLine } from '@/ui';

import { FormularioConsultorio } from './formulario-consultorio';
import { useCargarDemo } from './hooks';
import { LaminasBienvenida } from './laminas-bienvenida';

type Paso = 'inicio' | 'crear';

const ENTRADA = FadeIn.duration(260).reduceMotion(ReduceMotion.System);

/** Bienvenida (HU-26, HU-27): crear el consultorio o explorar con datos ficticios. */
export function OnboardingScreen() {
  const consulta = useConsultorio();
  const demo = useCargarDemo();
  const [paso, setPaso] = useState<Paso>('inicio');
  const [creando, setCreando] = useState(false);
  const reducir = useReducedMotion();
  const enfocada = useIsFocused();
  // El sismógrafo solo escucha el sensor mientras la bienvenida está a la vista.
  const { energia } = useSismografo({ activo: enfocada && paso === 'inicio' && !reducir, impulso: 0.85 });

  // En el formulario, el botón atrás de Android vuelve a la bienvenida en vez de cerrar la app.
  useEffect(() => {
    if (paso !== 'crear') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPaso('inicio');
      return true;
    });
    return () => sub.remove();
  }, [paso]);

  const irALaApp = () => router.replace('/');

  // Si ya hay consultorio (p. ej. un enlace directo a esta ruta) no se crea otro.
  if (consulta.data && demo.isIdle && !creando) return <Redirect href="/" />;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={paso === 'inicio' ? ['top', 'bottom'] : ['top']}>
      {/* Sin animación: la bienvenida reemplaza a las pestañas y no debe dejar ver lo que había debajo. */}
      <Stack.Screen options={{ animation: 'none', gestureEnabled: false }} />

      {paso === 'crear' ? (
        <Animated.View key="crear" entering={ENTRADA} className="flex-1">
          <FormularioConsultorio onVolver={() => setPaso('inicio')} onCreado={irALaApp} />
        </Animated.View>
      ) : (
        <View key="inicio" className="flex-1 pb-4">
          <View className="flex-1 justify-center gap-3">
            <Aparecer orden={0} className="px-5">
              <Text variant="number" accessibilityRole="header">
                Trazo
              </Text>
              <Text variant="bodyLarge" className="text-ink-soft">
                Tu consultorio en calma.
              </Text>
            </Aparecer>

            {/* Sismógrafo vivo de borde a borde: entra agitado, se calma y responde al movimiento del teléfono. */}
            <Aparecer orden={1}>
              {reducir ? (
                <TraceLine height={104} agitation={0.85} calmFrom={0.55} strokeWidth={2.4} animate={false} />
              ) : (
                <TraceLine height={104} agitation={0.05} calmFrom={1} strokeWidth={2.4} animate={false} energia={energia} />
              )}
            </Aparecer>
          </View>

          <Aparecer orden={2}>
            <LaminasBienvenida />
          </Aparecer>

          <View className="gap-3 px-5 pt-2">
            <Aparecer orden={3}>
              <Button
                label="Crear mi consultorio"
                onPress={() => {
                  setCreando(true);
                  setPaso('crear');
                }}
                disabled={demo.isPending}
              />
            </Aparecer>
            <Aparecer orden={4}>
              <Button
                label="Explorar con datos de demostración"
                variant="secondary"
                loading={demo.isPending}
                onPress={() => demo.mutate(undefined, { onSuccess: irALaApp })}
                accessibilityHint="Carga pacientes y citas ficticias para recorrer la app"
              />
            </Aparecer>
            <Aparecer orden={5}>
              {demo.isError ? (
                <Text variant="label" className="text-center text-danger" accessibilityLiveRegion="polite">
                  No pudimos cargar la demostración. Intenta de nuevo.
                </Text>
              ) : (
                <Text variant="caption" className="text-center text-ink-soft">
                  Tus datos se guardan solo en este teléfono. La demostración usa datos ficticios.
                </Text>
              )}
            </Aparecer>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
