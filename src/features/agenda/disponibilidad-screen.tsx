import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Disponibilidad } from '@/domain/types';
import { fechaClave, isoDesde } from '@/lib/dates';
import { color } from '@/theme';
import { Aparecer, Presionable, Text, TraceLine } from '@/ui';

import { BotonIcono } from './boton-icono';
import { EditorBloqueo, textoBloqueo } from './editor-bloqueo';
import { EditorFranja } from './editor-franja';
import { useBloqueosVigentes, useDisponibilidad } from './hooks';
import { aMinutos, ETIQUETA_MODALIDAD, NOMBRES_DIA, VENTANA_FIN, VENTANA_INICIO } from './rules';
import { useAhoraMs } from './use-ahora-ms';

type Edicion = { tipo: 'franja'; dia: number; id?: string } | { tipo: 'bloqueo'; id?: string };

const horasTexto = (min: number) => {
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} h`;
};

/** Las filas y editores se reacomodan con resorte al abrir, guardar o borrar. */
const REACOMODO = LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System);
const ENTRADA = FadeIn.duration(200).reduceMotion(ReduceMotion.System);

/**
 * Disponibilidad (HU-13): la semana como siete carriles de 7:00 a 20:00. Las franjas y los bloqueos
 * se agregan con la fila "+" y se editan en el sitio, sin salir de la pantalla.
 */
export function DisponibilidadScreen() {
  const insets = useSafeAreaInsets();
  const hoy = fechaClave(new Date(useAhoraMs()));
  const dispQ = useDisponibilidad();
  const bloqueosQ = useBloqueosVigentes(isoDesde(hoy));
  const [edicion, setEdicion] = useState<Edicion | null>(null);

  const franjas = dispQ.data ?? [];
  const bloqueos = bloqueosQ.data ?? [];
  const cerrar = () => setEdicion(null);
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/agenda'));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <Aparecer orden={0} className="flex-row items-center gap-3 px-5 py-3">
        <BotonIcono etiqueta="Volver" icono={<CaretLeftIcon size={18} color={color.ink} />} onPress={volver} />
        <Text variant="title" accessibilityRole="header" numberOfLines={1} className="flex-1">
          Disponibilidad
        </Text>
      </Aparecer>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Aparecer orden={1}>
            <Text variant="body" className="text-ink-soft">
              Tus horas de atención de cada semana. La agenda sombrea lo que queda por fuera y al agendar solo se ofrecen
              estas horas.
            </Text>
          </Aparecer>

          {dispQ.isPending ? (
            <TraceLine height={40} />
          ) : (
            <View className="gap-5">
              {NOMBRES_DIA.map((nombre, i) => {
                const dia = i + 1;
                const delDia = franjas.filter((f) => f.diaSemana === dia);
                const total = delDia.reduce((s, f) => s + aMinutos(f.horaFin) - aMinutos(f.horaInicio), 0);
                const nueva = edicion?.tipo === 'franja' && edicion.dia === dia && !edicion.id;
                return (
                  <Aparecer key={dia} orden={i + 2} reacomodar className="gap-2">
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text variant="heading">{nombre}</Text>
                      <Text variant="caption" className="font-mono text-ink-soft">
                        {delDia.length ? horasTexto(total) : 'Sin atención'}
                      </Text>
                    </View>
                    <Carril franjas={delDia} />
                    {delDia.map((f) =>
                      edicion?.tipo === 'franja' && edicion.id === f.id ? (
                        <EditorFranja
                          key={f.id}
                          dia={dia}
                          franja={f}
                          otras={delDia.filter((o) => o.id !== f.id)}
                          onCerrar={cerrar}
                        />
                      ) : (
                        <Animated.View key={f.id} entering={ENTRADA} layout={REACOMODO}>
                          <Presionable
                            accessibilityRole="button"
                            accessibilityLabel={`${nombre}, ${f.horaInicio} a ${f.horaFin}, ${ETIQUETA_MODALIDAD[f.modalidad].toLowerCase()}. Editar`}
                            onPress={() => setEdicion({ tipo: 'franja', dia, id: f.id })}
                            hundir={0.98}
                            contentClassName="min-h-[48px] flex-row items-center gap-3 rounded-field border border-line bg-surface px-4">
                            <Text variant="mono" className="flex-1">
                              {f.horaInicio} a {f.horaFin}
                            </Text>
                            <Text variant="caption" className="text-ink-soft">
                              {ETIQUETA_MODALIDAD[f.modalidad]}
                            </Text>
                            <Text variant="label" className="text-accent">
                              Editar
                            </Text>
                          </Presionable>
                        </Animated.View>
                      ),
                    )}
                    {nueva ? (
                      <EditorFranja dia={dia} otras={delDia} onCerrar={cerrar} />
                    ) : (
                      <FilaAgregar
                        etiqueta="Agregar franja"
                        accessibilityLabel={`Agregar franja el ${nombre.toLowerCase()}`}
                        onPress={() => setEdicion({ tipo: 'franja', dia })}
                      />
                    )}
                  </Aparecer>
                );
              })}
            </View>
          )}

          <Aparecer orden={9} reacomodar className="mt-4 gap-2">
            <Text variant="title">Bloqueos</Text>
            <Text variant="body" className="text-ink-soft">
              Vacaciones, jornadas o diligencias. En esas horas no se ofrecen citas aunque caigan dentro de tu horario.
            </Text>
            {bloqueos.map((b) =>
              edicion?.tipo === 'bloqueo' && edicion.id === b.id ? (
                <EditorBloqueo key={b.id} bloqueo={b} hoy={hoy} onCerrar={cerrar} />
              ) : (
                <Animated.View key={b.id} entering={ENTRADA} layout={REACOMODO}>
                  <Presionable
                    accessibilityRole="button"
                    accessibilityLabel={`${b.motivo ?? 'Bloqueo'}, ${textoBloqueo(b)}. Editar`}
                    onPress={() => setEdicion({ tipo: 'bloqueo', id: b.id })}
                    hundir={0.98}
                    contentClassName="min-h-[56px] flex-row items-center gap-3 rounded-field bg-quiet px-4 py-2">
                    <View className="flex-1 gap-0.5">
                      <Text variant="bodyMedium" numberOfLines={1}>
                        {b.motivo ?? 'Bloqueo'}
                      </Text>
                      <Text variant="caption" className="text-ink-soft">
                        {textoBloqueo(b)}
                      </Text>
                    </View>
                    <Text variant="label" className="text-accent">
                      Editar
                    </Text>
                  </Presionable>
                </Animated.View>
              ),
            )}
            {bloqueos.length === 0 && edicion?.tipo !== 'bloqueo' ? (
              <Text variant="caption" className="text-ink-soft">
                No tienes bloqueos próximos.
              </Text>
            ) : null}
            {edicion?.tipo === 'bloqueo' && !edicion.id ? (
              <EditorBloqueo hoy={hoy} onCerrar={cerrar} />
            ) : (
              <FilaAgregar etiqueta="Agregar bloqueo" onPress={() => setEdicion({ tipo: 'bloqueo' })} />
            )}
          </Aparecer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Carril del día de 7:00 a 20:00 con las franjas en tinta: la semana se lee de un vistazo. */
function Carril({ franjas }: { franjas: Disponibilidad[] }) {
  const total = VENTANA_FIN - VENTANA_INICIO;
  return (
    <View
      className="h-2 overflow-hidden rounded-full bg-quiet"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {franjas.map((f) => {
        const ini = Math.max(VENTANA_INICIO, aMinutos(f.horaInicio));
        const fin = Math.min(VENTANA_FIN, aMinutos(f.horaFin));
        if (fin <= ini) return null;
        return (
          <Animated.View
            key={f.id}
            entering={ENTRADA}
            layout={REACOMODO}
            className="absolute bottom-0 top-0 rounded-full bg-ink"
            style={{ left: `${((ini - VENTANA_INICIO) / total) * 100}%`, width: `${((fin - ini) / total) * 100}%` }}
          />
        );
      })}
    </View>
  );
}

/** Fila fantasma "+": crea en contexto, sin botón "Nuevo" suelto. */
function FilaAgregar({ etiqueta, accessibilityLabel, onPress }: { etiqueta: string; accessibilityLabel?: string; onPress: () => void }) {
  return (
    <Animated.View layout={REACOMODO}>
      <Presionable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? etiqueta}
        onPress={onPress}
        hundir={0.98}
        contentClassName="min-h-[44px] flex-row items-center justify-center gap-1 rounded-field border border-dashed border-ink-soft">
        <PlusIcon size={14} color={color.inkSoft} />
        <Text variant="label" className="text-ink-soft">
          {etiqueta}
        </Text>
      </Presionable>
    </Animated.View>
  );
}
