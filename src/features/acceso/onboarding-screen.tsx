import { Redirect, router, Stack } from 'expo-router';
import { DeviceMobileIcon } from 'phosphor-react-native/src/icons/DeviceMobile';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConsultorio } from '@/data/hooks';
import { color, space } from '@/theme';
import { Button, Text, TraceLine } from '@/ui';

import { FormularioConsultorio } from './formulario-consultorio';
import { useCargarDemo } from './hooks';

type Paso = 'inicio' | 'crear';

/** Bienvenida (HU-26, HU-27): crear el consultorio o explorar con datos ficticios. */
export function OnboardingScreen() {
  const consulta = useConsultorio();
  const demo = useCargarDemo();
  const [paso, setPaso] = useState<Paso>('inicio');
  const [creando, setCreando] = useState(false);
  const reducirMovimiento = useReducedMotion();
  const entrada = reducirMovimiento ? undefined : FadeIn.duration(260);

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
    <SafeAreaView style={styles.root} edges={paso === 'inicio' ? ['top', 'bottom'] : ['top']}>
      <Stack.Screen options={{ animation: 'fade', gestureEnabled: false }} />

      {paso === 'crear' ? (
        <Animated.View key="crear" entering={entrada} style={styles.root}>
          <FormularioConsultorio
            onVolver={() => setPaso('inicio')}
            onCreado={irALaApp}
          />
        </Animated.View>
      ) : (
        <Animated.View key="inicio" entering={entrada} style={styles.inicio}>
          <View style={styles.hero}>
            <TraceLine height={120} calmFrom={0.55} strokeWidth={2.4} style={styles.trazo} />
            <Text variant="number" accessibilityRole="header">
              Trazo
            </Text>
            <Text variant="bodyLarge" tone={color.inkSoft}>
              Agenda, pacientes, cobros y atención solidaria de tu consultorio, en un solo lugar.
            </Text>
          </View>

          <View style={styles.acciones}>
            <View style={styles.nota}>
              <DeviceMobileIcon size={20} color={color.inkSoft} />
              <Text variant="caption" tone={color.inkSoft} style={styles.notaTexto}>
                Tus datos se guardan solo en este teléfono. No necesitas cuenta ni contraseña.
              </Text>
            </View>
            <Button
              label="Crear mi consultorio"
              onPress={() => {
                setCreando(true);
                setPaso('crear');
              }}
              disabled={demo.isPending}
            />
            <Button
              label="Explorar con datos de demostración"
              variant="secondary"
              loading={demo.isPending}
              onPress={() => demo.mutate(undefined, { onSuccess: irALaApp })}
              accessibilityHint="Carga pacientes y citas ficticias para recorrer la app"
            />
            {demo.isError ? (
              <Text variant="label" tone={color.danger} accessibilityLiveRegion="polite">
                No pudimos cargar la demostración. Intenta de nuevo.
              </Text>
            ) : (
              <Text variant="caption" tone={color.inkSoft} style={styles.centrado}>
                La demostración usa pacientes y citas ficticias.
              </Text>
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  inicio: { flex: 1, justifyContent: 'space-between', paddingHorizontal: space.xl, paddingBottom: space.lg },
  hero: { flex: 1, justifyContent: 'center', gap: space.md },
  trazo: { marginHorizontal: -space.xl, marginBottom: space.lg },
  acciones: { gap: space.md },
  nota: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xs },
  notaTexto: { flex: 1 },
  centrado: { textAlign: 'center' },
});
