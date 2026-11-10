import * as Haptics from 'expo-haptics';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { LockSimpleOpenIcon } from 'phosphor-react-native/src/icons/LockSimpleOpen';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSismografo } from '@/features/calma/use-sismografo';
import { color } from '@/theme';
import { Aparecer, Button, Text, TraceLine } from '@/ui';

import { abrirSesion } from './sesion';
import { useEstadoApp } from './use-estado-app';
import { verificarIdentidad } from './verificacion';

/** Espera breve antes de pedir la verificación al volver: iOS cancela el diálogo si la app aún no está activa. */
const PAUSA_ANTES_DE_PEDIR = 350;

/** Pantalla completa de bloqueo (HU-01). No muestra ningún dato del consultorio. */
export function PantallaBloqueo() {
  const estadoApp = useEstadoApp();
  const reducir = useReducedMotion();
  const { energia } = useSismografo({ activo: !reducir, impulso: 0.7 });
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
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center gap-4">
        <Aparecer orden={0} className="px-5">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-quiet">
            <LockSimpleIcon size={26} color={color.ink} />
          </View>
        </Aparecer>

        {/* Sismógrafo vivo de borde a borde: se agita si mueves el teléfono y se calma al dejarlo quieto. */}
        <Aparecer orden={1}>
          {reducir ? (
            <TraceLine height={96} agitation={0.8} calmFrom={0.5} strokeWidth={2} animate={false} />
          ) : (
            <TraceLine height={96} agitation={0.05} calmFrom={1} strokeWidth={2} animate={false} energia={energia} />
          )}
        </Aparecer>

        <Aparecer orden={2} className="gap-2 px-5">
          <Text variant="title" accessibilityRole="header">
            Trazo está bloqueado
          </Text>
          <Text variant="body" className="text-ink-soft">
            Tus pacientes, notas y cobros quedan protegidos. Desbloquea con tu huella, tu rostro o el código del teléfono.
          </Text>
        </Aparecer>
      </View>

      <Aparecer orden={3} className="gap-3 px-5 pb-4">
        {error ? (
          <Text variant="label" className="text-danger" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        {sinProteccion ? (
          <>
            <View
              className="flex-row gap-3 rounded-field border border-line bg-surface p-4"
              accessibilityLiveRegion="polite">
              <WarningCircleIcon size={22} color={color.ink} />
              <Text variant="body" className="flex-1">
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
      </Aparecer>
    </SafeAreaView>
  );
}
