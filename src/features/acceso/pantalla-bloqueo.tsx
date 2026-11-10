import * as Haptics from 'expo-haptics';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { LockSimpleOpenIcon } from 'phosphor-react-native/src/icons/LockSimpleOpen';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { color, radius, space } from '@/theme';
import { Button, Text, TraceLine } from '@/ui';

import { abrirSesion } from './sesion';
import { useEstadoApp } from './use-estado-app';
import { verificarIdentidad } from './verificacion';

/** Espera breve antes de pedir la verificación al volver: iOS cancela el diálogo si la app aún no está activa. */
const PAUSA_ANTES_DE_PEDIR = 350;

/** Pantalla completa de bloqueo (HU-01). No muestra ningún dato del consultorio. */
export function PantallaBloqueo() {
  const estadoApp = useEstadoApp();
  const [verificando, setVerificando] = useState(false);
  const [sinProteccion, setSinProteccion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intentoAutomatico = useRef(false);

  const desbloquear = useCallback(async () => {
    setVerificando(true);
    setError(null);
    const resultado = await verificarIdentidad();
    setVerificando(false);
    switch (resultado.tipo) {
      case 'ok':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        abrirSesion();
        break;
      case 'sin-proteccion':
        setSinProteccion(true);
        break;
      case 'error':
        setError(resultado.mensaje);
        break;
      case 'cancelado':
        break;
    }
  }, []);

  // Al aparecer, pide la verificación una sola vez sin esperar el toque (cuando la app ya está activa).
  useEffect(() => {
    if (estadoApp !== 'active') return;
    const t = setTimeout(() => {
      if (intentoAutomatico.current) return;
      intentoAutomatico.current = true;
      void desbloquear();
    }, PAUSA_ANTES_DE_PEDIR);
    return () => clearTimeout(t);
  }, [estadoApp, desbloquear]);

  // En Android el botón atrás no debe navegar la app que queda debajo.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.centro}>
        <View style={styles.sello}>
          <LockSimpleIcon size={26} color={color.ink} />
        </View>
        <TraceLine height={56} calmFrom={0.5} strokeWidth={2} style={styles.trazo} />
        <Text variant="title" accessibilityRole="header">
          Trazo está bloqueado
        </Text>
        <Text variant="body" tone={color.inkSoft}>
          Tus pacientes, notas y cobros quedan protegidos. Desbloquea con tu huella, tu rostro o el código del teléfono.
        </Text>
      </View>

      <View style={styles.pie}>
        {error ? (
          <Text variant="label" tone={color.danger} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        {sinProteccion ? (
          <>
            <View style={styles.aviso} accessibilityLiveRegion="polite">
              <WarningCircleIcon size={22} color={color.ink} />
              <Text variant="body" style={styles.avisoTexto}>
                Este teléfono no tiene huella, rostro ni código configurado, así que Trazo no puede verificar que eres tú.
                Configura un código de bloqueo en los ajustes del teléfono.
              </Text>
            </View>
            <Button label="Entrar sin verificar" onPress={abrirSesion} />
          </>
        ) : (
          <Button
            label="Desbloquear"
            onPress={() => void desbloquear()}
            loading={verificando}
            icon={<LockSimpleOpenIcon size={20} color={color.onAccent} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.xl, backgroundColor: color.canvas },
  centro: { flex: 1, justifyContent: 'center', gap: space.md },
  sello: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trazo: { marginVertical: space.sm },
  pie: { gap: space.md, paddingBottom: space.lg },
  aviso: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  avisoTexto: { flex: 1 },
});
