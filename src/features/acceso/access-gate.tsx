import { router, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { AppState, Keyboard, StyleSheet, View } from 'react-native';

import { useConsultorio } from '@/data/hooks';
import { color, space } from '@/theme';
import { Button, Text } from '@/ui';

import { CapaSuperior } from './capa-superior';
import { Cortina } from './cortina';
import { PantallaBloqueo } from './pantalla-bloqueo';
import { cerrarSesion, MINUTOS_PARA_BLOQUEAR, useSesionBloqueada } from './sesion';
import { appOculta, useEstadoApp } from './use-estado-app';
import { verificacionEnCurso } from './verificacion';

/**
 * Puerta de acceso (HU-01, HU-26, RNF-01). Se monta dentro de DatabaseGate, así que la base ya migró.
 *
 * - Sin consultorio: lleva a la bienvenida. El navegador se monta desde el primer render (children)
 *   y la redirección corre en un efecto, nunca antes; una cortina tapa el cambio para que no parpadee.
 * - Con `bloqueoActivo`: bloquea al abrir en frío y al volver tras 2 minutos o más en segundo plano.
 * - En segundo plano o inactiva: cortina neutra para que el selector de apps no muestre datos.
 * - Nunca bloquea en la bienvenida.
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
    // Desde ajustes (borrar todo) puede haber pantallas apiladas: se vuelve a la raíz y se reemplaza.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/onboarding');
  }, [navegadorListo, sinConsultorio, enBienvenida]);

  const cargando = consulta.isPending || (sinConsultorio && !enBienvenida);
  const bloqueada =
    !cargando && !errorSinDatos && !enBienvenida && sesionBloqueada && consulta.data?.bloqueoActivo === true;
  // Con el bloqueo a la vista no hace falta la cortina: evita un parpadeo mientras iOS muestra el código.
  const privacidad = appOculta(estadoApp) && !bloqueada && !cargando;
  const tapada = cargando || errorSinDatos || bloqueada || privacidad;

  return (
    <View style={styles.root}>
      <View
        style={styles.root}
        accessibilityElementsHidden={tapada}
        importantForAccessibility={tapada ? 'no-hide-descendants' : 'auto'}>
        {children}
      </View>

      {errorSinDatos ? (
        <CapaSuperior modal>
          <Cortina animate={false}>
            <Text variant="heading">No pudimos leer tu consultorio</Text>
            <Text variant="body" tone={color.inkSoft}>
              Los datos siguen en este teléfono. Intenta de nuevo.
            </Text>
            <Button label="Reintentar" variant="secondary" onPress={() => void consulta.refetch()} style={styles.boton} />
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

/** Cierra la sesión si la app estuvo en segundo plano MINUTOS_PARA_BLOQUEAR o más. */
function useBloqueoPorAusencia() {
  useEffect(() => {
    let salioEn: number | null = null;
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') {
        // El PIN de Android abre otra pantalla: ese viaje no cuenta como salir de Trazo.
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  boton: { alignSelf: 'flex-start', marginTop: space.sm },
});
