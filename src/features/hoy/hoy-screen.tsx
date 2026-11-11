import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { useCallback, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useCitasDelDia,
  useCitasPorConfirmar,
  useCitasSolicitadas,
  useConsultorio,
  useCuposSolidariosSemana,
  usePagosPendientes,
  useSeguimientos,
} from '@/data/hooks';
import { qk } from '@/data/keys';
import { fechaClave, fechaCorta, horaTexto } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';
import { color, tabBarInset } from '@/theme';
import { Aparecer, Fab, ListRow, NumeroAnimado, SolidarioMark, Text, Tile } from '@/ui';

import { Accion } from './accion';
import { BloqueProxima } from './bloque-proxima';
import { BotonIcono } from './boton-icono';
import { abrirCita, FilaAnimada, FilaCita, FilaContacto, FilaSeguimiento } from './filas';
import { useParaContactar } from './hooks';
import { diaRelativo, nodosDelDia, plural, proximaCita, siguientesCitas } from './rules';
import { Segmentos } from './segmentos';
import { ALTO_TRAZO, TrazoInteractivo } from './trazo-interactivo';
import { useAhora } from './use-ahora';

/** Medidas del encabezado abierto: aire, fila del título, Trazo y aire. */
const AIRE_ARRIBA = 4;
const FILA_TITULO = 48;
const AIRE_ABAJO = 8;
const ALTO_ENCABEZADO = AIRE_ARRIBA + FILA_TITULO + ALTO_TRAZO + AIRE_ABAJO;
/** Desplazamiento con el que el encabezado termina de encogerse. */
const RECORRIDO = 72;

/**
 * "Hoy" (HU-02): la línea del día y un bloque por cada pendiente; debajo, lo que pide acción.
 * Al hacer scroll el título se encoge y el Trazo queda fijo arriba como barra fina.
 */
export function HoyScreen() {
  const insets = useSafeAreaInsets();
  const ahora = useAhora();
  const ahoraMs = ahora.getTime();
  const hoy = fechaClave(ahora);
  const qc = useQueryClient();

  const citasQ = useCitasDelDia(hoy);
  const porConfirmarQ = useCitasPorConfirmar();
  const solicitadasQ = useCitasSolicitadas();
  const cuposQ = useCuposSolidariosSemana(hoy);
  const pendientesQ = usePagosPendientes();
  const seguimientosQ = useSeguimientos({ estado: 'pendiente', hasta: hoy });
  const contactarQ = useParaContactar();
  const { data: consultorio } = useConsultorio();

  // Las listas que dependen de la hora (próximas 24 h, solicitudes futuras) se recalculan al volver a "Hoy".
  useFocusEffect(
    useCallback(() => {
      void qc.invalidateQueries({ queryKey: [...qk.citas, 'por-confirmar'] });
      void qc.invalidateQueries({ queryKey: [...qk.citas, 'solicitadas'] });
    }, [qc]),
  );

  const scrollY = useSharedValue(0);
  const alDesplazar = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const colapso = useDerivedValue(() => interpolate(scrollY.get(), [0, RECORRIDO], [0, 1], Extrapolation.CLAMP));
  const tituloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(colapso.get(), [0, 1], [1, 0.64]) }],
    transformOrigin: 'left center',
  }));
  const fechaAnimada = useAnimatedStyle(() => ({ opacity: interpolate(colapso.get(), [0, 0.5], [1, 0], Extrapolation.CLAMP) }));
  const bordeAnimado = useAnimatedStyle(() => ({ opacity: colapso.get() }));

  const citas = citasQ.data ?? [];
  const proxima = proximaCita(citas, ahoraMs);
  const siguientes = siguientesCitas(citas, ahoraMs);
  const porConfirmar = porConfirmarQ.data?.length ?? 0;
  const solicitadas = solicitadasQ.data ?? [];
  const cuposUsados = cuposQ.data ?? 0;
  const cuposTotal = consultorio?.cuposSolidariosSemana ?? 0;
  const pendientes = pendientesQ.data ?? [];
  const porCobrar = pendientes.reduce((suma, p) => suma + p.monto, 0);
  const seguimientos = seguimientosQ.data ?? [];
  const paraContactar = contactarQ.data ?? [];

  return (
    <GestureHandlerRootView>
      <View className="flex-1 bg-canvas">
        <Animated.ScrollView
          onScroll={alDesplazar}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + ALTO_ENCABEZADO + 8,
            paddingBottom: tabBarInset + 96,
          }}>
          <View className="gap-3 px-5">
            <Aparecer orden={0}>
              <BloqueProxima cita={proxima} ahoraMs={ahoraMs} cargando={citasQ.isPending} onAbrir={abrirCita} />
            </Aparecer>

            <Aparecer orden={1} className="flex-row gap-3">
              <Tile
                tone="confirmar"
                className="flex-1"
                onPress={() => router.push('/por-confirmar')}
                accessibilityLabel={`${plural(porConfirmar, 'cita', 'citas')} por confirmar`}>
                <NumeroAnimado valor={porConfirmar} variant="title" className="text-menta-ink" />
                <Text variant="label" className="text-menta-ink">
                  por confirmar
                </Text>
              </Tile>
              <Tile
                tone="solidario"
                className="flex-1"
                onPress={() => router.navigate('/solidario')}
                accessibilityLabel={`${cuposUsados} de ${cuposTotal} cupos solidarios usados esta semana`}>
                <View className="flex-row items-baseline">
                  <NumeroAnimado valor={cuposUsados} variant="title" className="text-durazno-ink" />
                  <Text variant="title" className="text-durazno-ink">
                    /{cuposTotal}
                  </Text>
                </View>
                <Text variant="label" className="text-durazno-ink">
                  cupos solidarios
                </Text>
                <Segmentos usados={cuposUsados} total={cuposTotal} />
              </Tile>
            </Aparecer>

            <Aparecer orden={2}>
              <Tile
                tone="pagos"
                contentClassName="flex-row items-center justify-between gap-3"
                onPress={() => router.push('/pagos')}
                accessibilityLabel={`Por cobrar ${formatoCOP(porCobrar)}, ${plural(pendientes.length, 'sesión', 'sesiones')}`}>
                <View>
                  <Text variant="label" className="text-mantequilla-ink">
                    Por cobrar
                  </Text>
                  <Text variant="caption" className="text-mantequilla-ink">
                    {pendientes.length === 0 ? 'Todo al día' : plural(pendientes.length, 'sesión', 'sesiones')}
                  </Text>
                </View>
                <NumeroAnimado valor={porCobrar} formato={formatoCOP} variant="heading" className="text-mantequilla-ink" />
              </Tile>
            </Aparecer>

            <Aparecer orden={3}>
              <Tile
                tone="neutral"
                contentClassName="flex-row items-center justify-between gap-3"
                onPress={() => router.push('/resumen')}
                accessibilityLabel="Ver el resumen de tu semana">
                <Text variant="heading" className="flex-1">
                  Tu semana
                </Text>
                <CaretRightIcon size={20} color={color.ink} />
              </Tile>
            </Aparecer>

            {solicitadas.length > 0 ? (
              <Seccion titulo="Solicitudes" orden={4}>
                {solicitadas.map((c, i) => (
                  <FilaAnimada key={c.id}>
                    <ListRow
                      lead={horaTexto(c.inicio)}
                      title={c.paciente.nombre}
                      subtitle={`${diaRelativo(c.inicio, hoy)} · ${c.modalidad}${c.origen === 'web' ? ' · desde la web' : ''}`}
                      badge={c.esSolidaria ? <SolidarioMark /> : null}
                      last={i === solicitadas.length - 1}
                      onPress={() => abrirCita(c.id)}
                      trailing={
                        <Accion
                          label="Revisar"
                          accessibilityLabel={`Revisar la solicitud de ${c.paciente.nombre}`}
                          onPress={() => abrirCita(c.id)}
                        />
                      }
                    />
                  </FilaAnimada>
                ))}
              </Seccion>
            ) : null}

            {seguimientos.length > 0 ? (
              <Seccion titulo="Seguimientos de hoy" orden={5}>
                {seguimientos.map((s, i) => (
                  <FilaSeguimiento key={s.id} seguimiento={s} hoy={hoy} last={i === seguimientos.length - 1} />
                ))}
              </Seccion>
            ) : null}

            {siguientes.length > 0 ? (
              <Seccion titulo="Siguientes" orden={6}>
                {siguientes.map((c, i) => (
                  <FilaCita
                    key={c.id}
                    cita={c}
                    subtitulo={c.paciente.telefono ? c.modalidad : `${c.modalidad} · sin teléfono`}
                    last={i === siguientes.length - 1}
                  />
                ))}
              </Seccion>
            ) : null}

            {paraContactar.length > 0 ? (
              <Seccion titulo="Para contactar" orden={7}>
                {paraContactar.map((p, i) => (
                  <FilaContacto key={p.pacienteId} paciente={p} last={i === paraContactar.length - 1} />
                ))}
              </Seccion>
            ) : null}
          </View>
        </Animated.ScrollView>

        <View className="absolute left-0 right-0 top-0 bg-canvas px-5" style={{ paddingTop: insets.top + AIRE_ARRIBA, paddingBottom: AIRE_ABAJO }}>
          <View className="h-12 flex-row items-center justify-between">
            <View className="flex-row items-baseline gap-2">
              <Animated.View style={tituloAnimado}>
                <Text variant="display" accessibilityRole="header">
                  Hoy
                </Text>
              </Animated.View>
              <Animated.View style={fechaAnimada}>
                <Text variant="caption" className="text-ink-soft">
                  {fechaCorta(ahora.toISOString())}
                </Text>
              </Animated.View>
            </View>
            <View className="-mr-2 flex-row items-center gap-2">
              <BotonIcono etiqueta="Ajustes" onPress={() => router.push('/ajustes')} icono={<GearSixIcon size={24} color={color.ink} />} />
            </View>
          </View>
          <TrazoInteractivo puntos={nodosDelDia(citas, ahoraMs)} colapso={colapso} onAbrir={abrirCita} />
          <Animated.View style={bordeAnimado} className="absolute bottom-0 left-0 right-0 h-px bg-line" />
        </View>

        <Fab label="Agendar" onPress={() => router.push('/cita/nueva')} />
      </View>
    </GestureHandlerRootView>
  );
}

/** Sección de lista: entra en cascada y se reacomoda cuando las de arriba pierden filas. */
function Seccion({ titulo, orden, children }: { titulo: string; orden: number; children: ReactNode }) {
  return (
    <Aparecer orden={orden} reacomodar className="mt-3 gap-1">
      <Text variant="heading" accessibilityRole="header">
        {titulo}
      </Text>
      <View>{children}</View>
    </Aparecer>
  );
}
