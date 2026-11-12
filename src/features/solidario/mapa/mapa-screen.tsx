import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CornersOutIcon } from 'phosphor-react-native/src/icons/CornersOut';
import { NavigationArrowIcon } from 'phosphor-react-native/src/icons/NavigationArrow';
import { PulseIcon } from 'phosphor-react-native/src/icons/Pulse';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import { fechaCorta, fechaLarga, horaTexto } from '@/lib/dates';
import { color } from '@/theme';
import { Button, NumeroAnimado, Presionable, Text } from '@/ui';

import { PEREIRA, type Sismo } from '../api/sismo.mapper';
import { formatoMagnitud, haceCuanto, useSismos } from '../api/use-sismos';
import { BotonIcono } from '../components/accion';
import { volverASolidario } from '../components/pantalla-detalle';
import { comoLlegar } from '../dispositivo';
import { useJornadas } from '../hooks';
import type { JornadaConInscritos } from '../repo';
import { capitalizar, etiquetaTipo, plural } from '../rules';
import { MapaLeaflet, type MapaLeafletHandle } from './mapa-leaflet';
import { AvisoPermiso, ControlesMapa, Leyenda, SinMapa, TituloMapa } from './piezas';
import { useMiUbicacion } from './use-mi-ubicacion';

type Seleccion = { tipo: 'jornada'; id: string } | { tipo: 'sismo'; id: string } | null;

const tienePunto = (j: JornadaConInscritos): j is JornadaConInscritos & { latitud: number; longitud: number } =>
  typeof j.latitud === 'number' && typeof j.longitud === 'number';

/** Tiempo máximo de espera a que Leaflet cargue antes de avisar que no hay mapa. */
const ESPERA_MAPA_MS = 15_000;

const entrada = FadeInDown.springify().damping(18).stiffness(190).reduceMotion(ReduceMotion.System);
const salida = FadeOutDown.duration(160).reduceMotion(ReduceMotion.System);

/**
 * Mapa solidario: jornadas próximas y pasadas, sismos recientes y la ubicación propia sobre
 * OpenStreetMap. Tocar un punto abre su tarjeta con "Ver jornada" y "Cómo llegar".
 */
export function MapaScreen({ jornadaId }: { jornadaId?: string }) {
  const insets = useSafeAreaInsets();
  const mapa = useRef<MapaLeafletHandle>(null);
  const encuadrado = useRef(false);
  const [intento, setIntento] = useState(0);
  const [listo, setListo] = useState(false);
  const [sinMapa, setSinMapa] = useState(false);
  const [seleccion, setSeleccion] = useState<Seleccion>(jornadaId ? { tipo: 'jornada', id: jornadaId } : null);
  const [verSismos, setVerSismos] = useState(true);
  const [avisoCerrado, setAvisoCerrado] = useState(false);
  const [ahora] = useState(() => Date.now());

  const jornadasQ = useJornadas();
  const sismosQ = useSismos();
  const { permiso, buscando, fallo, irAMiUbicacion } = useMiUbicacion(mapa, listo);

  const jornadas = jornadasQ.data ?? [];
  const conPunto = jornadas.filter(tienePunto);
  const sinPunto = jornadas.length - conPunto.length;
  const sismos = sismosQ.data ?? [];
  const ahoraIso = new Date(ahora).toISOString();

  const jornadaActiva = seleccion?.tipo === 'jornada' ? conPunto.find((j) => j.id === seleccion.id) : undefined;
  const sismoActivo = seleccion?.tipo === 'sismo' ? sismos.find((s) => s.id === seleccion.id) : undefined;

  // Si Leaflet no responde a tiempo (sin internet), se muestra el estado sin mapa.
  useEffect(() => {
    if (listo || sinMapa) return;
    const espera = setTimeout(() => setSinMapa(true), ESPERA_MAPA_MS);
    return () => clearTimeout(espera);
  }, [listo, sinMapa, intento]);

  // Jornadas en el mapa. La primera vez se encuadran (o se centra la que llegó por parámetro).
  useEffect(() => {
    if (!listo || !jornadasQ.data) return;
    const puntos = jornadasQ.data.filter(tienePunto);
    mapa.current?.setJornadas(puntos.map((j) => ({ id: j.id, lat: j.latitud, lng: j.longitud, proxima: j.fin >= ahoraIso })));
    if (encuadrado.current) return;
    encuadrado.current = true;
    const inicial = jornadaId ? puntos.find((j) => j.id === jornadaId) : undefined;
    if (inicial) {
      mapa.current?.seleccionar(inicial.id);
      mapa.current?.moverA(inicial, 15);
    } else if (puntos.length) {
      mapa.current?.encuadrar(puntos);
    }
  }, [listo, jornadasQ.data, jornadaId, ahoraIso]);

  // Sismos como círculos según magnitud.
  useEffect(() => {
    if (!listo || !sismosQ.data) return;
    mapa.current?.setSismos(sismosQ.data.map((s) => ({ id: s.id, lat: s.latitud, lng: s.longitud, mag: s.magnitud })));
  }, [listo, sismosQ.data]);

  const elegirJornada = (j: JornadaConInscritos & { latitud: number; longitud: number }, mover: boolean) => {
    setSeleccion({ tipo: 'jornada', id: j.id });
    mapa.current?.seleccionar(j.id);
    if (mover) mapa.current?.moverA(j, 15);
  };

  const soltar = () => {
    setSeleccion(null);
    mapa.current?.seleccionar(null);
  };

  const alternarSismos = () => {
    const visible = !verSismos;
    setVerSismos(visible);
    mapa.current?.mostrarSismos(visible);
    if (!visible && seleccion?.tipo === 'sismo') soltar();
    if (visible && sismos.length) mapa.current?.encuadrar([PEREIRA, ...sismos]);
  };

  const reintentar = () => {
    encuadrado.current = false;
    setListo(false);
    setSinMapa(false);
    setIntento((n) => n + 1);
  };

  const detalle = jornadasQ.data
    ? conPunto.length
      ? plural(conPunto.length, '1 jornada en el mapa', `${conPunto.length} jornadas en el mapa`)
      : 'Pereira, Risaralda'
    : undefined;

  return (
    <View className="flex-1 bg-canvas">
      <MapaLeaflet
        key={intento}
        ref={mapa}
        centro={PEREIRA}
        zoom={13}
        onListo={() => setListo(true)}
        onSinMapa={() => setSinMapa(true)}
        onJornada={(id) => {
          const j = conPunto.find((x) => x.id === id);
          if (j) elegirJornada(j, false);
        }}
        onSismo={(id) => {
          setSeleccion({ tipo: 'sismo', id });
          mapa.current?.seleccionar(null);
        }}
        onTocarMapa={soltar}
      />

      {sinMapa ? <SinMapa top={insets.top + 56} onReintentar={reintentar} /> : null}

      <View className="pointer-events-box-none absolute left-0 right-0 flex-row items-start px-4" style={{ top: insets.top + 8 }}>
        <BotonIcono icon={CaretLeftIcon} label="Volver" fondo="surface" onPress={volverASolidario} />
        <TituloMapa titulo="Mapa solidario" detalle={detalle} />
        <View className="w-11" />
      </View>

      {sinMapa ? null : (
        <ControlesMapa mapa={mapa} top={insets.top + 76} buscando={buscando} onMiUbicacion={() => void irAMiUbicacion()}>
          <BotonIcono
            icon={CornersOutIcon}
            label="Ver todas las jornadas"
            fondo="surface"
            disabled={!conPunto.length}
            onPress={() => mapa.current?.encuadrar(conPunto)}
          />
          <BotonIcono
            icon={PulseIcon}
            label={verSismos ? 'Ocultar sismos recientes' : 'Mostrar sismos recientes'}
            fondo="surface"
            tone={verSismos ? color.accent : color.inkSoft}
            onPress={alternarSismos}
          />
        </ControlesMapa>
      )}

      {sinMapa ? null : (
        <View className="pointer-events-box-none absolute bottom-0 left-0 right-0 gap-2" style={{ paddingBottom: insets.bottom + 12 }}>
          {jornadaActiva ? (
            <Animated.View key={jornadaActiva.id} entering={entrada} exiting={salida} className="px-4">
              <TarjetaJornada jornada={jornadaActiva} proxima={jornadaActiva.fin >= ahoraIso} onCerrar={soltar} />
            </Animated.View>
          ) : sismoActivo ? (
            <Animated.View key={sismoActivo.id} entering={entrada} exiting={salida} className="px-4">
              <TarjetaSismo sismo={sismoActivo} ahora={ahora} onCerrar={soltar} />
            </Animated.View>
          ) : (
            <Animated.View key="base" entering={entrada} exiting={salida} className="gap-2">
              {!avisoCerrado && permiso !== 'concedido' && permiso !== 'comprobando' ? (
                <View className="px-4">
                  <AvisoPermiso permiso={permiso} onPermitir={() => void irAMiUbicacion()} onCerrar={() => setAvisoCerrado(true)} />
                </View>
              ) : null}

              {fallo ? (
                <View className="mx-4 rounded-field border border-line bg-surface px-4 py-3">
                  <Text variant="caption" className="text-ink-soft">
                    No pudimos ubicarte. Revisa que el GPS del teléfono esté encendido.
                  </Text>
                </View>
              ) : null}

              {jornadasQ.data && conPunto.length === 0 ? (
                <View className="mx-4 gap-1 rounded-tile border border-line bg-surface p-4">
                  <Text variant="heading">Ninguna jornada tiene punto en el mapa</Text>
                  <Text variant="body" className="text-ink-soft">
                    Abre una jornada, toca editar y usa «Elegir en el mapa» para ubicarla.
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
                  {conPunto.map((j) => (
                    <Presionable
                      key={j.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver en el mapa: ${j.titulo}, ${fechaLarga(j.inicio)}`}
                      onPress={() => elegirJornada(j, true)}
                      contentClassName="min-h-[44px] max-w-[240px] flex-row items-center gap-2 rounded-full border border-line bg-surface px-4">
                      <View className={cn('h-3 w-3 rounded-full', j.fin >= ahoraIso ? 'bg-menta-ink' : 'border-2 border-ink-soft bg-surface')} />
                      <Text variant="label" numberOfLines={1} className="shrink">
                        {capitalizar(fechaCorta(j.inicio))} · {j.titulo}
                      </Text>
                    </Presionable>
                  ))}
                </ScrollView>
              )}

              <View className="mx-4 flex-row flex-wrap items-center gap-x-4 gap-y-1 self-start rounded-field border border-line bg-surface px-3 py-2">
                <Leyenda tipo="proxima" texto="Próxima" />
                <Leyenda tipo="pasada" texto="Pasada" />
                {verSismos && sismos.length ? <Leyenda tipo="sismo" texto="Sismo reciente" /> : null}
                {sinPunto > 0 ? (
                  <Text variant="caption" className="text-ink-soft">
                    {plural(sinPunto, '1 jornada sin punto', `${sinPunto} jornadas sin punto`)}
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}

/* ---------- Tarjetas inferiores ---------- */

type TarjetaJornadaProps = {
  jornada: JornadaConInscritos & { latitud: number; longitud: number };
  proxima: boolean;
  onCerrar: () => void;
};

function TarjetaJornada({ jornada: j, proxima, onCerrar }: TarjetaJornadaProps) {
  const texto = proxima ? 'text-menta-ink' : 'text-ink';
  return (
    <View className={cn('gap-3 rounded-tile p-4', proxima ? 'bg-menta' : 'border border-line bg-surface')}>
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="label" className={texto}>
            {etiquetaTipo(j.tipo)} · {proxima ? 'Próxima' : 'Ya se hizo'}
          </Text>
          <Text variant="heading" className={texto} numberOfLines={2}>
            {j.titulo}
          </Text>
          <Text variant="body" className={texto}>
            {capitalizar(fechaLarga(j.inicio))}, {horaTexto(j.inicio)} a {horaTexto(j.fin)}
          </Text>
          <Text variant="body" className={texto} numberOfLines={1}>
            {j.lugar}
            {j.barrio ? ` · ${j.barrio}` : ''}
          </Text>
        </View>
        <BotonIcono icon={XIcon} label="Cerrar tarjeta de la jornada" fondo="surface" onPress={onCerrar} />
      </View>
      <View className="flex-row items-baseline gap-1">
        <NumeroAnimado valor={j.inscritos} variant="title" className={texto} />
        <Text variant="label" className={texto}>
          de {j.cupos} inscritos
        </Text>
      </View>
      <View className="flex-row gap-2">
        <Button
          label="Ver jornada"
          size="sm"
          className="flex-1"
          onPress={() => router.push({ pathname: '/jornada/[id]', params: { id: j.id } })}
        />
        <Button
          label="Cómo llegar"
          variant="secondary"
          size="sm"
          className="flex-1"
          icon={<NavigationArrowIcon size={18} color={color.ink} />}
          onPress={() => comoLlegar(j, j.lugar)}
          accessibilityHint="Abre la app de mapas del teléfono con la ruta"
        />
      </View>
    </View>
  );
}

function TarjetaSismo({ sismo: s, ahora, onCerrar }: { sismo: Sismo; ahora: number; onCerrar: () => void }) {
  return (
    <View className="flex-row items-center gap-4 rounded-tile border border-line bg-surface p-4">
      <View className="items-center">
        <Text variant="number">{formatoMagnitud(s.magnitud)}</Text>
        <Text variant="caption" className="text-ink-soft">
          magnitud
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="bodyMedium" numberOfLines={2}>
          {s.lugar}
        </Text>
        <Text variant="caption" className="text-ink-soft">
          A {s.distanciaKm} km de Pereira · {haceCuanto(s.momento, ahora)} · {s.profundidadKm} km de profundidad
        </Text>
      </View>
      <BotonIcono icon={XIcon} label="Cerrar tarjeta del sismo" onPress={onCerrar} />
    </View>
  );
}
