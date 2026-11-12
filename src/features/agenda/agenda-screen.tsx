import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CalendarPlusIcon } from 'phosphor-react-native/src/icons/CalendarPlus';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  measure,
  ReduceMotion,
  scrollTo,
  useAnimatedRef,
  useFrameCallback,
  useReducedMotion,
  useScrollOffset,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnUI } from 'react-native-worklets';

import { useActualizarCita, useCitasEntre, useConsultorio, useCuposSolidariosSemana } from '@/data/hooks';
import { ErrorSolape, type Cita } from '@/domain/types';
import { fechaClave, fechaCorta, inicioSemana, isoDesde, minutosDelDia, sumarDias, sumarMinutos } from '@/lib/dates';
import { color, tabBarInset } from '@/theme';
import { Aparecer, EmptyState, Text, TraceLine } from '@/ui';

import { AvisoFlotante, type Aviso } from './aviso-flotante';
import { BotonIcono, BotonTexto } from './boton-icono';
import { CuposSemana } from './cupos-semana';
import { consultasDeHuecos, useBloqueosEntre, useCitasParaAvisos, useDisponibilidad } from './hooks';
import { LineaDeTiempo, yDeMinuto } from './linea-tiempo';
import { cancelarAviso, programarAviso, sincronizarAvisos } from './notifications';
import {
  aHora,
  bloqueosDelDia,
  citasEnDia,
  diasDesde,
  duracionMin,
  fechaTitulo,
  franjasDelDia,
  huecosDelDia,
  mesTitulo,
  primerHuecoLibre,
  resumenFranjas,
  validarMovimiento,
  ventanaDelDia,
  type CitaEnDia,
} from './rules';
import { SemanaTira } from './semana-tira';
import { useAgendaStore } from './store';
import { instante, useAhoraMs } from './use-ahora-ms';

const DIAS_BUSQUEDA = 28;
/** Franja (px) cerca de los bordes donde arrastrar una cita desplaza la lista sola. */
const ZONA_SCROLL = 72;
const VELOCIDAD_SCROLL = 12;
/** Margen superior del contenido desplazable (clase `pt-4`). */
const MARGEN_CONTENIDO = 16;

const textoCitas = (n: number) => (n === 0 ? 'Sin citas' : n === 1 ? '1 cita' : `${n} citas`);
const esSolape = (e: unknown) => e instanceof ErrorSolape || (e instanceof Error && e.name === 'ErrorSolape');

/**
 * Agenda (HU-03): tira de la semana y línea de tiempo del día. Se agenda tocando un hueco libre
 * (HU-04), se abre una cita tocando su bloque y se reprograma arrastrándola.
 */
export function AgendaScreen() {
  const ahoraMs = useAhoraMs();
  const hoy = fechaClave(new Date(ahoraMs));
  const reducir = useReducedMotion();
  const qc = useQueryClient();

  // Estado de interfaz en Zustand: otras pantallas pueden dejar la Agenda en un día concreto.
  const dia = useAgendaStore((s) => s.dia);
  const direccion = useAgendaStore((s) => s.direccion);
  const resaltado = useAgendaStore((s) => s.resaltado);
  const irADia = useAgendaStore((s) => s.irADia);
  const irAHoy = useAgendaStore((s) => s.irAHoy);
  const moverSemana = useAgendaStore((s) => s.moverSemana);
  const resaltar = useAgendaStore((s) => s.resaltar);
  const quitarResaltado = useAgendaStore((s) => s.quitarResaltado);

  const lunes = inicioSemana(dia);
  const semana = diasDesde(lunes, 7);
  const desde = isoDesde(lunes);
  const hasta = isoDesde(sumarDias(lunes, 7));

  const citasQ = useCitasEntre(desde, hasta);
  const bloqueosQ = useBloqueosEntre(desde, hasta);
  const dispQ = useDisponibilidad();
  const consultorio = useConsultorio().data;
  const cupos = useCuposSolidariosSemana(dia).data ?? 0;
  const actualizar = useActualizarCita();

  // Avisos locales de la próxima semana (sin pedir permiso aquí: eso pasa al agendar).
  const avisosQ = useCitasParaAvisos(isoDesde(hoy), isoDesde(sumarDias(hoy, 8)));
  useEffect(() => {
    if (avisosQ.data) void sincronizarAvisos(avisosQ.data);
  }, [avisosQ.data]);

  const citasSemana = citasQ.data ?? [];
  const conteos: Record<string, number> = {};
  for (const c of citasSemana) {
    const clave = fechaClave(c.inicio);
    conteos[clave] = (conteos[clave] ?? 0) + 1;
  }

  const todasLasFranjas = dispQ.data ?? [];
  const sinDisponibilidad = todasLasFranjas.length === 0;
  const franjas = franjasDelDia(todasLasFranjas, dia);
  const bloqueos = bloqueosDelDia(bloqueosQ.data ?? [], dia);
  const citas = citasEnDia(citasSemana, dia);
  const ventana = ventanaDelDia([...citas, ...franjas]);
  const huecos = huecosDelDia({ dia, ventana, franjas, sinDisponibilidad, bloqueos, citas, ahoraMs });
  const ahoraMin = dia === hoy ? minutosDelDia(new Date(ahoraMs).toISOString()) : null;
  const cargando = citasQ.isPending || dispQ.isPending;
  const diaSinAtencion = !sinDisponibilidad && franjas.length === 0 && citas.length === 0 && bloqueos.length === 0;
  const huecoResaltado = resaltado && resaltado.dia === dia ? resaltado.ini : null;

  /* ---------- Avisos flotantes (motivo de un rechazo, deshacer) ---------- */

  const [aviso, setAviso] = useState<Aviso | null>(null);
  const contador = useRef(0);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const mostrarAviso = (texto: string, accion?: Aviso['accion']) => {
    contador.current += 1;
    setAviso({ id: contador.current, texto, accion });
  };

  /* ---------- Desplazamiento de la línea de tiempo ---------- */

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const altoContenido = useSharedValue(0);
  const dedoY = useSharedValue(-1);
  const [arrastrando, setArrastrando] = useState(false);
  const [yLinea, setYLinea] = useState<number | null>(null);

  // Al abrir, al cambiar de día o al señalar un hueco, la vista viaja a la hora útil.
  const claveVista = `${dia}|${huecoResaltado ?? ''}`;
  const ultimaVista = useRef<string | null>(null);
  const objetivo =
    huecoResaltado !== null
      ? huecoResaltado - 60
      : ahoraMin !== null
        ? ahoraMin - 60
        : (citas[0]?.ini ?? franjas[0]?.ini ?? 8 * 60) - 30;
  useEffect(() => {
    if (cargando || yLinea === null || ultimaVista.current === claveVista) return;
    ultimaVista.current = claveVista;
    const y = Math.max(0, MARGEN_CONTENIDO + yLinea + yDeMinuto(ventana, Math.max(ventana.ini, objetivo)) - 8);
    scheduleOnUI(
      (destino: number, animado: boolean) => {
        'worklet';
        scrollTo(scrollRef, 0, destino, animado);
      },
      y,
      !reducir,
    );
  }, [cargando, yLinea, claveVista, ventana, objetivo, reducir, scrollRef]);

  // El pulso del hueco señalado dura unos segundos y se retira solo.
  useEffect(() => {
    if (!resaltado) return;
    const t = setTimeout(quitarResaltado, 3600);
    return () => clearTimeout(t);
  }, [resaltado, quitarResaltado]);

  // Mientras se arrastra una cita cerca del borde, la lista se desplaza sola.
  const autoScroll = useFrameCallback(() => {
    'worklet';
    const y = dedoY.get();
    if (y < 0) return;
    const m = measure(scrollRef);
    if (!m) return;
    const arriba = m.pageY + ZONA_SCROLL;
    const abajo = m.pageY + m.height - tabBarInset - ZONA_SCROLL;
    let v = 0;
    if (y < arriba) v = -Math.min(VELOCIDAD_SCROLL, (arriba - y) / 5);
    else if (y > abajo) v = Math.min(VELOCIDAD_SCROLL, (y - abajo) / 5);
    if (v === 0) return;
    const maximo = Math.max(0, altoContenido.get() - m.height);
    scrollTo(scrollRef, 0, clamp(scrollOffset.get() + v, 0, maximo), false);
  }, false);

  const alArrastrar = (activo: boolean) => {
    setArrastrando(activo);
    autoScroll.setActive(activo);
  };

  /* ---------- Acciones ---------- */

  // Deslizar la tira cambia de semana; las flechas hacen lo mismo sin gesto.
  const deslizar = usePanGesture({
    runOnJS: true,
    activeOffsetX: [-14, 14],
    failOffsetY: [-12, 12],
    onDeactivate: (e) => {
      if (!e.canceled && Math.abs(e.translationX) >= 40) moverSemana(e.translationX < 0 ? 1 : -1);
    },
  });

  const abrirHueco = (ini: number, enDia = dia) =>
    router.push({ pathname: '/cita/nueva', params: { inicio: isoDesde(enDia, aHora(ini)) } });
  const abrirCita = (id: string) => router.push({ pathname: '/cita/[id]', params: { id } });
  const abrirDisponibilidad = () => router.push('/ajustes/disponibilidad');

  const reprogramarAviso = (cita: Pick<Cita, 'id' | 'inicio' | 'estado'>) =>
    cita.estado === 'confirmada' ? programarAviso(cita.id, cita.inicio) : cancelarAviso(cita.id);

  const deshacer = async (id: string, anterior: Pick<Cita, 'inicio' | 'fin' | 'recordadaEn'>) => {
    setAviso(null);
    try {
      const cita = await actualizar.mutateAsync({ id, cambios: anterior });
      void reprogramarAviso(cita);
    } catch (e) {
      mostrarAviso(esSolape(e) ? 'No se pudo deshacer: ese horario ya está ocupado.' : 'No se pudo deshacer el cambio.');
    }
  };

  /** Soltar una cita arrastrada: valida RN-01, guarda, mueve el aviso local y ofrece deshacer. */
  const moverCita = async (bloque: CitaEnDia, nuevoIni: number): Promise<boolean> => {
    const { cita } = bloque;
    const minutos = duracionMin(cita);
    const revision = validarMovimiento({
      dia,
      rango: { ini: nuevoIni, fin: nuevoIni + minutos },
      citaId: cita.id,
      citas,
      bloqueos,
      ahoraMs: instante(),
    });
    if (!revision.ok) {
      mostrarAviso(revision.motivo);
      return false;
    }
    const anterior = { inicio: cita.inicio, fin: cita.fin, recordadaEn: cita.recordadaEn };
    try {
      const inicio = isoDesde(dia, aHora(nuevoIni));
      const nueva = await actualizar.mutateAsync({
        id: cita.id,
        cambios: { inicio, fin: sumarMinutos(inicio, minutos), recordadaEn: null },
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void reprogramarAviso(nueva);
      mostrarAviso(`${cita.paciente.nombre.split(' ')[0]} pasa a las ${aHora(nuevoIni)}`, {
        etiqueta: 'Deshacer',
        alPresionar: () => void deshacer(cita.id, anterior),
      });
      return true;
    } catch (e) {
      mostrarAviso(esSolape(e) ? 'Ese horario se cruza con otra cita.' : 'No se pudo mover la cita. Intenta de nuevo.');
      return false;
    }
  };

  /** Próximo hueco libre según disponibilidad, bloqueos y citas: salta al día y lo señala. */
  const [buscando, setBuscando] = useState(false);
  const buscarHueco = async () => {
    if (buscando) return;
    setBuscando(true);
    try {
      const consultas = consultasDeHuecos(isoDesde(hoy), isoDesde(sumarDias(hoy, DIAS_BUSQUEDA)));
      const [lasFranjas, losBloqueos, lasCitas] = await Promise.all([
        qc.fetchQuery(consultas.disponibilidad),
        qc.fetchQuery(consultas.bloqueos),
        qc.fetchQuery(consultas.citas),
      ]);
      const hueco = primerHuecoLibre({
        desde: hoy,
        dias: DIAS_BUSQUEDA,
        franjas: lasFranjas,
        bloqueos: losBloqueos,
        citas: lasCitas,
        duracion: consultorio?.duracionCita ?? 50,
        ahoraMs: instante(),
      });
      if (!hueco) {
        mostrarAviso('No hay huecos libres en las próximas cuatro semanas.');
        return;
      }
      resaltar(hueco);
      mostrarAviso(`Libre ${hueco.dia === hoy ? 'hoy' : `el ${fechaCorta(isoDesde(hueco.dia))}`} a las ${aHora(hueco.ini)}`, {
        etiqueta: 'Agendar',
        alPresionar: () => {
          setAviso(null);
          abrirHueco(hueco.ini, hueco.dia);
        },
      });
    } catch {
      mostrarAviso('No se pudo buscar el próximo hueco. Intenta de nuevo.');
    } finally {
      setBuscando(false);
    }
  };

  // El contenido entra desde el lado hacia donde se avanzó.
  const entrada = (direccion > 0 ? FadeInRight : direccion < 0 ? FadeInLeft : FadeIn)
    .duration(240)
    .reduceMotion(ReduceMotion.System);

  return (
    <GestureHandlerRootView>
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        <View className="gap-3 border-b border-line px-5 pb-3 pt-4">
          <Aparecer orden={0} className="flex-row items-center gap-2">
            <Text variant="display" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit className="flex-1">
              {mesTitulo(dia)}
            </Text>
            <BotonIcono
              destacado
              etiqueta="Ir al próximo hueco libre"
              icono={<CalendarPlusIcon size={20} color={color.accent} />}
              onPress={() => void buscarHueco()}
            />
            <BotonIcono
              etiqueta="Semana anterior"
              icono={<CaretLeftIcon size={18} color={color.ink} />}
              onPress={() => moverSemana(-1)}
            />
            <BotonIcono
              etiqueta="Semana siguiente"
              icono={<CaretRightIcon size={18} color={color.ink} />}
              onPress={() => moverSemana(1)}
            />
          </Aparecer>

          <Aparecer orden={1}>
            <GestureDetector gesture={deslizar}>
              <View accessibilityHint="Desliza a los lados para cambiar de semana">
                <Animated.View key={lunes} entering={entrada}>
                  <SemanaTira dias={semana} seleccionado={dia} hoy={hoy} conteos={conteos} onSelect={irADia} />
                </Animated.View>
              </View>
            </GestureDetector>
          </Aparecer>

          <Aparecer orden={2} className="min-h-[44px] flex-row items-center gap-3">
            <View className="flex-1">
              {consultorio ? <CuposSemana usados={cupos} total={consultorio.cuposSolidariosSemana} /> : null}
            </View>
            {dia !== hoy ? <BotonTexto borde etiqueta="Hoy" accessibilityLabel="Ir a hoy" onPress={irAHoy} /> : null}
          </Aparecer>
        </View>

        <Aparecer orden={3} className="flex-1">
          <Animated.ScrollView
            ref={scrollRef}
            scrollEnabled={!arrastrando}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={(_, alto) => altoContenido.set(alto)}>
            <View className="px-5 pt-4" style={{ paddingBottom: tabBarInset + 96 }}>
              <Animated.View key={dia} entering={entrada} className="gap-3">
                <View className="flex-row items-center gap-3">
                  <View className="flex-1 gap-0.5">
                    <Text variant="heading">{dia === hoy ? `Hoy, ${fechaTitulo(dia).toLowerCase()}` : fechaTitulo(dia)}</Text>
                    <Text variant="caption" className="text-ink-soft">
                      {textoCitas(citas.length)}
                      {sinDisponibilidad
                        ? ' · Sin horario definido'
                        : franjas.length
                          ? ` · Atiendes ${resumenFranjas(franjas)}`
                          : ' · Sin atención este día'}
                    </Text>
                  </View>
                  <BotonTexto etiqueta="Horario" accessibilityLabel="Editar disponibilidad" onPress={abrirDisponibilidad} />
                </View>

                {cargando ? (
                  <TraceLine height={40} />
                ) : diaSinAtencion ? (
                  <EmptyState title="Día sin atención" body="No tienes horas de atención este día. Puedes abrir una franja en Horario." />
                ) : (
                  <View onLayout={(e) => setYLinea(e.nativeEvent.layout.y)}>
                    <LineaDeTiempo
                      ventana={ventana}
                      huecos={huecos}
                      bloqueos={bloqueos}
                      citas={citas}
                      ahoraMin={ahoraMin}
                      resaltado={huecoResaltado}
                      scrollOffset={scrollOffset}
                      dedoY={dedoY}
                      onHueco={abrirHueco}
                      onCita={abrirCita}
                      onArrastre={alArrastrar}
                      onMover={moverCita}
                    />
                  </View>
                )}
              </Animated.View>
            </View>
          </Animated.ScrollView>
        </Aparecer>

        <AvisoFlotante aviso={aviso} onCerrar={cerrarAviso} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
