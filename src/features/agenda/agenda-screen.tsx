import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCitasEntre, useConsultorio, useCuposSolidariosSemana } from '@/data/hooks';
import { fechaClave, inicioSemana, isoDesde, minutosDelDia, sumarDias } from '@/lib/dates';
import { color, space, tabBarInset } from '@/theme';
import { EmptyState, Text, TraceLine } from '@/ui';

import { BotonIcono, BotonTexto } from './boton-icono';
import { CuposSemana } from './cupos-semana';
import { useBloqueosEntre, useCitasParaAvisos, useDisponibilidad } from './hooks';
import { LineaDeTiempo, yDeMinuto } from './linea-tiempo';
import { sincronizarAvisos } from './notifications';
import {
  aHora,
  bloqueosDelDia,
  citasEnDia,
  diasDesde,
  fechaTitulo,
  franjasDelDia,
  huecosDelDia,
  mesTitulo,
  resumenFranjas,
  ventanaDelDia,
} from './rules';
import { SemanaTira } from './semana-tira';
import { useAhoraMs } from './use-ahora-ms';

const textoCitas = (n: number) => (n === 0 ? 'Sin citas' : n === 1 ? '1 cita' : `${n} citas`);

/**
 * Agenda (HU-03): tira de la semana y línea de tiempo del día. Se agenda tocando un hueco libre
 * (HU-04) y se abre una cita tocando su bloque.
 */
export function AgendaScreen() {
  const ahoraMs = useAhoraMs();
  const hoy = fechaClave(new Date(ahoraMs));
  const [dia, setDia] = useState(hoy);

  // Deslizar la tira cambia de semana (el gesto le gana al toque solo si es horizontal).
  const [deslizar] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) >= 40) setDia((d) => sumarDias(d, g.dx < 0 ? 7 : -7));
      },
    }),
  );

  const lunes = inicioSemana(dia);
  const semana = diasDesde(lunes, 7);
  const desde = isoDesde(lunes);
  const hasta = isoDesde(sumarDias(lunes, 7));

  const citasQ = useCitasEntre(desde, hasta);
  const bloqueosQ = useBloqueosEntre(desde, hasta);
  const dispQ = useDisponibilidad();
  const consultorio = useConsultorio().data;
  const cupos = useCuposSolidariosSemana(dia).data ?? 0;

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

  // Al cambiar de día, lleva la vista a la hora útil: ahora, la primera cita o el inicio de la jornada.
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const ultimoDia = useRef<string | null>(null);
  const [yLinea, setYLinea] = useState<number | null>(null);
  const objetivo = ahoraMin !== null ? ahoraMin - 60 : (citas[0]?.ini ?? franjas[0]?.ini ?? 8 * 60) - 30;
  useEffect(() => {
    if (cargando || yLinea === null || ultimoDia.current === dia) return;
    ultimoDia.current = dia;
    const y = Math.max(0, yLinea + yDeMinuto(ventana, Math.max(ventana.ini, objetivo)) - space.sm);
    requestAnimationFrame(() => scroll.current?.scrollTo({ y, animated: false }));
  }, [cargando, yLinea, dia, ventana, objetivo]);

  const irADia = (d: string) => setDia(d);
  const abrirHueco = (ini: number) =>
    router.push({ pathname: '/cita/nueva', params: { inicio: isoDesde(dia, aHora(ini)) } });
  const abrirCita = (id: string) => router.push({ pathname: '/cita/[id]', params: { id } });
  const abrirDisponibilidad = () => router.push('/ajustes/disponibilidad');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.root}>
        <View style={styles.cabecera}>
          <View style={styles.tituloFila}>
            <Text variant="display" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit style={styles.titulo}>
              {mesTitulo(dia)}
            </Text>
            {dia !== hoy ? <BotonTexto borde etiqueta="Hoy" accessibilityLabel="Ir a hoy" onPress={() => irADia(hoy)} /> : null}
            <BotonIcono
              etiqueta="Semana anterior"
              icono={<CaretLeftIcon size={18} color={color.ink} />}
              onPress={() => irADia(sumarDias(dia, -7))}
            />
            <BotonIcono
              etiqueta="Semana siguiente"
              icono={<CaretRightIcon size={18} color={color.ink} />}
              onPress={() => irADia(sumarDias(dia, 7))}
            />
          </View>
          <SemanaTira
            dias={semana}
            seleccionado={dia}
            hoy={hoy}
            conteos={conteos}
            onSelect={irADia}
            panHandlers={deslizar.panHandlers}
          />
          {consultorio ? <CuposSemana usados={cupos} total={consultorio.cuposSolidariosSemana} /> : null}
        </View>

        <ScrollView
          ref={scroll}
          style={styles.root}
          contentContainerStyle={styles.contenido}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}>
          <View style={styles.resumen}>
            <View style={styles.resumenTexto}>
              <Text variant="heading">{dia === hoy ? `Hoy, ${fechaTitulo(dia).toLowerCase()}` : fechaTitulo(dia)}</Text>
              <Text variant="caption" tone={color.inkSoft}>
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
            <EmptyState
              title="Día sin atención"
              body="No tienes horas de atención este día. Puedes abrir una franja en Horario."
            />
          ) : (
            <View onLayout={(e) => setYLinea(e.nativeEvent.layout.y)}>
              <LineaDeTiempo
                ventana={ventana}
                huecos={huecos}
                bloqueos={bloqueos}
                citas={citas}
                ahoraMin={ahoraMin}
                onHueco={abrirHueco}
                onCita={abrirCita}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  cabecera: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.md,
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  tituloFila: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  titulo: { flex: 1 },
  contenido: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: tabBarInset + space.xxxl, gap: space.md },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  resumenTexto: { flex: 1, gap: 2 },
});
