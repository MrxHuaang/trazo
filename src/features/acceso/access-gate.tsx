import { router, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { AppState, Keyboard, View } from 'react-native';

import { useConsultorio } from '@/data/hooks';
import { Button, Text } from '@/ui';

import { CapaSuperior } from './capa-superior';
import { Cortina } from './cortina';
import { PantallaBloqueo } from './pantalla-bloqueo';
import { cerrarSesion, MINUTOS_PARA_BLOQUEAR, useSesionBloqueada } from './sesion';
import { appOculta, useEstadoApp } from './use-estado-app';
import { verificacionEnCurso } from './verificacion';

/**
 * HU-01, HU-26, RNF-01. Va dentro de DatabaseGate. La redirección a la bienvenida corre en un efecto
 * porque el navegador tiene que montarse antes; mientras tanto la cortina tapa el salto.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const consulta = useConsultorio();
  const segmentos = useSegments();
  const navegadorListo = typeof useRootNavigationState()?.key === 'string';
  const estadoApp = useEstadoApp();
  const sesionBloqueada = useSesionBloqueada();
  useBloqueoPorAusencia();

  const enBienvenida = segmentos[0] === 'onboarding';
  const sinConsultorio = consulta.isSuccess && consulta.data === null;
  const errorSinDatos = consulta.isError && consulta.data === undefined;

  useEffect(() => {
    if (!navegadorListo || !sinConsultorio || enBienvenida) return;
    // Tras borrar todo desde ajustes quedan pantallas apiladas; hay que cerrarlas antes del replace.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/onboarding');
  }, [navegadorListo, sinConsultorio, enBienvenida]);

  const cargando = consulta.isPending || (sinConsultorio && !enBienvenida);
  const bloqueada =
    !cargando && !errorSinDatos && !enBienvenida && sesionBloqueada && consulta.data?.bloqueoActivo === true;
  // La cortina esconde los datos en el selector de apps. Con el bloqueo encima sobra y parpadea con el código de iOS.
  const privacidad = appOculta(estadoApp) && !bloqueada && !cargando;
  const tapada = cargando || errorSinDatos || bloqueada || privacidad;

  return (
    <View className="flex-1">
      <View
        className="flex-1"
        accessibilityElementsHidden={tapada}
        importantForAccessibility={tapada ? 'no-hide-descendants' : 'auto'}>
        {children}
      </View>

      {errorSinDatos ? (
        <CapaSuperior modal>
          <Cortina animate={false}>
            <Text variant="heading">No pudimos leer tu consultorio</Text>
            <Text variant="body" className="text-ink-soft">
              Los datos siguen en este teléfono. Intenta de nuevo.
            </Text>
            <Button
              label="Reintentar"
              variant="secondary"
              onPress={() => void consulta.refetch()}
              className="mt-2 self-start"
            />
          </Cortina>
        </CapaSuperior>
      ) : cargando ? (
        <CapaSuperior modal>
          <Cortina />
        </CapaSuperior>
      ) : bloqueada ? (
        <CapaSuperior modal>
          <PantallaBloqueo />
        </CapaSuperior>
      ) : privacidad ? (
        <CapaSuperior modal>
          <Cortina animate={false} />
        </CapaSuperior>
      ) : null}
    </View>
  );
}

// Solo cuenta background: inactive salta con el centro de control y no debe bloquear.
function useBloqueoPorAusencia() {
  useEffect(() => {
    let salioEn: number | null = null;
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') {
        // El PIN de Android manda la app a segundo plano; eso no es salir de Trazo.
        if (!verificacionEnCurso()) salioEn ??= Date.now();
        return;
      }
      if (estado === 'active') {
        if (salioEn !== null && Date.now() - salioEn >= MINUTOS_PARA_BLOQUEAR * 60_000) {
          Keyboard.dismiss();
          cerrarSesion();
        }
        salioEn = null;
      }
    });
    return () => sub.remove();
  }, []);
}
