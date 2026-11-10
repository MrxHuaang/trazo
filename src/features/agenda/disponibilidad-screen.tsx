import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Disponibilidad } from '@/domain/types';
import { fechaClave, isoDesde } from '@/lib/dates';
import { color, radius, space } from '@/theme';
import { Text, TraceLine } from '@/ui';

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
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.cabecera}>
        <BotonIcono etiqueta="Volver" icono={<CaretLeftIcon size={18} color={color.ink} />} onPress={volver} />
        <Text variant="title" accessibilityRole="header" numberOfLines={1} style={styles.flex}>
          Disponibilidad
        </Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + space.xxxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text variant="body" tone={color.inkSoft}>
            Tus horas de atención de cada semana. La agenda sombrea lo que queda por fuera y al agendar solo se ofrecen estas horas.
          </Text>

          {dispQ.isPending ? (
            <TraceLine height={40} />
          ) : (
            <View style={styles.semana}>
              {NOMBRES_DIA.map((nombre, i) => {
                const dia = i + 1;
                const delDia = franjas.filter((f) => f.diaSemana === dia);
                const total = delDia.reduce((s, f) => s + aMinutos(f.horaFin) - aMinutos(f.horaInicio), 0);
                const nueva = edicion?.tipo === 'franja' && edicion.dia === dia && !edicion.id;
                return (
                  <View key={dia} style={styles.dia}>
                    <View style={styles.diaCabecera}>
                      <Text variant="heading">{nombre}</Text>
                      <Text variant="caption" tone={color.inkSoft}>
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
                        <Pressable
                          key={f.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${nombre}, ${f.horaInicio} a ${f.horaFin}, ${ETIQUETA_MODALIDAD[f.modalidad].toLowerCase()}. Editar`}
                          onPress={() => setEdicion({ tipo: 'franja', dia, id: f.id })}
                          style={({ pressed }) => [styles.fila, pressed && styles.pressed]}>
                          <Text variant="mono" style={styles.flex}>
                            {f.horaInicio} a {f.horaFin}
                          </Text>
                          <Text variant="caption" tone={color.inkSoft}>
                            {ETIQUETA_MODALIDAD[f.modalidad]}
                          </Text>
                          <Text variant="label" tone={color.accent}>
                            Editar
                          </Text>
                        </Pressable>
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
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.seccion}>
            <Text variant="title">Bloqueos</Text>
            <Text variant="body" tone={color.inkSoft}>
              Vacaciones, jornadas o diligencias. En esas horas no se ofrecen citas aunque caigan dentro de tu horario.
            </Text>
            {bloqueos.map((b) =>
              edicion?.tipo === 'bloqueo' && edicion.id === b.id ? (
                <EditorBloqueo key={b.id} bloqueo={b} hoy={hoy} onCerrar={cerrar} />
              ) : (
                <Pressable
                  key={b.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${b.motivo ?? 'Bloqueo'}, ${textoBloqueo(b)}. Editar`}
                  onPress={() => setEdicion({ tipo: 'bloqueo', id: b.id })}
                  style={({ pressed }) => [styles.bloqueo, pressed && styles.pressed]}>
                  <View style={styles.bloqueoTexto}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {b.motivo ?? 'Bloqueo'}
                    </Text>
                    <Text variant="caption" tone={color.inkSoft}>
                      {textoBloqueo(b)}
                    </Text>
                  </View>
                  <Text variant="label" tone={color.accent}>
                    Editar
                  </Text>
                </Pressable>
              ),
            )}
            {bloqueos.length === 0 && edicion?.tipo !== 'bloqueo' ? (
              <Text variant="caption" tone={color.inkSoft}>
                No tienes bloqueos próximos.
              </Text>
            ) : null}
            {edicion?.tipo === 'bloqueo' && !edicion.id ? (
              <EditorBloqueo hoy={hoy} onCerrar={cerrar} />
            ) : (
              <FilaAgregar etiqueta="Agregar bloqueo" onPress={() => setEdicion({ tipo: 'bloqueo' })} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Carril del día de 7:00 a 20:00 con las franjas en tinta: la semana se lee de un vistazo. */
function Carril({ franjas }: { franjas: Disponibilidad[] }) {
  const total = VENTANA_FIN - VENTANA_INICIO;
  return (
    <View style={styles.carril} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {franjas.map((f) => {
        const ini = Math.max(VENTANA_INICIO, aMinutos(f.horaInicio));
        const fin = Math.min(VENTANA_FIN, aMinutos(f.horaFin));
        if (fin <= ini) return null;
        return (
          <View
            key={f.id}
            style={[
              styles.tramo,
              { left: `${((ini - VENTANA_INICIO) / total) * 100}%`, width: `${((fin - ini) / total) * 100}%` },
            ]}
          />
        );
      })}
    </View>
  );
}

/** Fila fantasma "+": crea en contexto, sin botón "Nuevo" suelto. */
function FilaAgregar({ etiqueta, accessibilityLabel, onPress }: { etiqueta: string; accessibilityLabel?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      onPress={onPress}
      style={({ pressed }) => [styles.agregar, pressed && styles.agregarActivo]}>
      {({ pressed }) => (
        <>
          <PlusIcon size={14} color={pressed ? color.accent : color.inkSoft} />
          <Text variant="label" tone={pressed ? color.accent : color.inkSoft}>
            {etiqueta}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  flex: { flex: 1 },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  contenido: { paddingHorizontal: space.xl, gap: space.lg },
  semana: { gap: space.xl },
  dia: { gap: space.sm },
  diaCabecera: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
  carril: { height: 8, borderRadius: radius.pill, backgroundColor: color.quiet, overflow: 'hidden' },
  tramo: { position: 'absolute', top: 0, bottom: 0, borderRadius: radius.pill, backgroundColor: color.ink },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.field,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  agregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    minHeight: 44,
    borderRadius: radius.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.inkSoft,
  },
  agregarActivo: { borderColor: color.accent, backgroundColor: color.surface },
  seccion: { gap: space.sm, marginTop: space.lg },
  bloqueo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.field,
    backgroundColor: color.quiet,
  },
  bloqueoTexto: { flex: 1, gap: 2 },
  pressed: { opacity: 0.6 },
});
