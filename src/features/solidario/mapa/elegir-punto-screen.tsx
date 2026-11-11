import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CrosshairIcon } from 'phosphor-react-native/src/icons/Crosshair';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color } from '@/theme';
import { Button, Text } from '@/ui';

import { PEREIRA } from '../api/sismo.mapper';
import { BotonIcono } from '../components/accion';
import { usePermisosStore } from '../store/use-permisos-store';
import { useUbicacionStore } from '../store/use-ubicacion-store';
import { MapaLeaflet, type MapaLeafletHandle } from './mapa-leaflet';
import { ControlesMapa, SinMapa, TituloMapa } from './piezas';
import { abrirAjustesDelSistema, type LatLng } from './ubicacion';
import { useMiUbicacion } from './use-mi-ubicacion';

const ESPERA_MAPA_MS = 15_000;
const entrada = FadeInDown.springify().damping(18).stiffness(190).reduceMotion(ReduceMotion.System);
const reacomodo = LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System);

/** 4,8133° N · 75,6961° O */
export const textoCoordenadas = ({ latitud, longitud }: LatLng) => {
  const f = (n: number) => Math.abs(n).toLocaleString('es-CO', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return `${f(latitud)}° ${latitud >= 0 ? 'N' : 'S'} · ${f(longitud)}° ${longitud >= 0 ? 'E' : 'O'}`;
};

const volver = () => (router.canGoBack() ? router.back() : router.replace('/solidario'));

/**
 * Modo selección del mapa: tocar el mapa marca dónde será la jornada. "Usar este punto" lo deja
 * en el formulario (store de Zustand) y vuelve. Funciona sin permiso de ubicación.
 */
export function ElegirPuntoScreen() {
  const insets = useSafeAreaInsets();
  const mapa = useRef<MapaLeafletHandle>(null);
  const inicial = useUbicacionStore((s) => s.puntoJornada);
  const fijarPuntoJornada = useUbicacionStore((s) => s.fijarPuntoJornada);
  const [punto, setPunto] = useState<LatLng | null>(inicial);
  const [listo, setListo] = useState(false);
  const [sinMapa, setSinMapa] = useState(false);
  const [intento, setIntento] = useState(0);
  const { permiso, buscando, fallo, irAMiUbicacion } = useMiUbicacion(mapa, listo);
  const pedir = usePermisosStore((s) => s.pedirUbicacion);
  const obtener = useUbicacionStore((s) => s.obtener);

  useEffect(() => {
    if (listo || sinMapa) return;
    const espera = setTimeout(() => setSinMapa(true), ESPERA_MAPA_MS);
    return () => clearTimeout(espera);
  }, [listo, sinMapa, intento]);

  // Si la jornada ya tenía punto, se muestra y se centra al cargar el mapa.
  useEffect(() => {
    if (!listo || !inicial) return;
    mapa.current?.setPunto(inicial);
    mapa.current?.moverA(inicial, 16);
  }, [listo, inicial]);

  const marcar = (p: LatLng) => {
    void Haptics.selectionAsync();
    setPunto(p);
  };

  const usarMiUbicacion = async () => {
    if (permiso === 'bloqueado') {
      void abrirAjustesDelSistema();
      return;
    }
    const estado = permiso === 'concedido' ? permiso : await pedir();
    if (estado !== 'concedido') return;
    const aqui = await obtener();
    if (!aqui) return;
    mapa.current?.setPunto(aqui);
    mapa.current?.moverA(aqui, 16);
    marcar(aqui);
  };

  const confirmar = () => {
    if (!punto) return;
    fijarPuntoJornada(punto);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    volver();
  };

  const reintentar = () => {
    setListo(false);
    setSinMapa(false);
    setIntento((n) => n + 1);
  };

  return (
    <View className="flex-1 bg-canvas">
      <MapaLeaflet
        key={intento}
        ref={mapa}
        centro={inicial ?? PEREIRA}
        zoom={inicial ? 16 : 13}
        elegir
        onListo={() => setListo(true)}
        onSinMapa={() => setSinMapa(true)}
        onPunto={marcar}
      />

      {sinMapa ? <SinMapa top={insets.top + 56} onReintentar={reintentar} /> : null}

      <View className="pointer-events-box-none absolute left-0 right-0 flex-row items-start px-4" style={{ top: insets.top + 8 }}>
        <BotonIcono icon={CaretLeftIcon} label="Volver sin cambiar el punto" fondo="surface" onPress={volver} />
        <TituloMapa titulo="Ubica la jornada" detalle="Toca el mapa donde será" />
        <View className="w-11" />
      </View>

      {sinMapa ? null : (
        <>
          <ControlesMapa mapa={mapa} top={insets.top + 76} buscando={buscando} onMiUbicacion={() => void irAMiUbicacion()} />

          <Animated.View
            entering={entrada}
            layout={reacomodo}
            className="absolute bottom-0 left-0 right-0 px-4"
            style={{ paddingBottom: insets.bottom + 12 }}>
            <View className="gap-3 rounded-tile border border-line bg-surface p-4">
              <View className="flex-row items-center gap-3">
                <View className={punto ? 'h-11 w-11 items-center justify-center rounded-full bg-accent' : 'h-11 w-11 items-center justify-center rounded-full bg-quiet'}>
                  <MapPinIcon size={22} color={punto ? color.onAccent : color.inkSoft} weight="fill" />
                </View>
                <View className="flex-1 gap-0.5" accessibilityLiveRegion="polite">
                  <Text variant="bodyMedium">{punto ? 'Punto marcado' : 'Aún sin punto'}</Text>
                  <Text variant={punto ? 'mono' : 'caption'} className="text-ink-soft">
                    {punto ? textoCoordenadas(punto) : 'Toca el mapa en el lugar de la jornada. Puedes acercar con dos dedos.'}
                  </Text>
                </View>
              </View>

              {fallo ? (
                <Text variant="caption" className="text-ink-soft">
                  No pudimos ubicarte. Revisa que el GPS esté encendido o marca el punto a mano.
                </Text>
              ) : null}

              <View className="flex-row gap-2">
                <Button
                  label={permiso === 'bloqueado' ? 'Activar ubicación' : 'Usar mi ubicación'}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  icon={<CrosshairIcon size={18} color={color.ink} />}
                  loading={buscando}
                  onPress={() => void usarMiUbicacion()}
                  accessibilityHint="Marca el punto donde estás ahora"
                />
                <Button label="Usar este punto" size="sm" className="flex-1" disabled={!punto} onPress={confirmar} />
              </View>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}
