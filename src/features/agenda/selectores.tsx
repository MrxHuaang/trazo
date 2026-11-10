/**
 * Selectores propios con chips (no hay datetimepicker en Expo Go sin compilar):
 * fecha en tira horizontal, hora en cuadrícula de 30 min y opciones sueltas.
 */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { isoDesde, numeroDia } from '@/lib/dates';
import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

import { diaAbreviado, fechaTitulo, type OpcionHora } from './rules';

type OpcionProps = {
  etiqueta: string;
  seleccionada: boolean;
  onPress: () => void;
  deshabilitada?: boolean;
  /** Texto tachado (p. ej. hora ocupada). */
  tachada?: boolean;
  mono?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Píldora seleccionable: tinta cuando está elegida, borde suave cuando no. */
export function Opcion({ etiqueta, seleccionada, onPress, deshabilitada, tachada, mono, accessibilityLabel, style }: OpcionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      accessibilityState={{ selected: seleccionada, disabled: !!deshabilitada }}
      disabled={deshabilitada}
      onPress={() => {
        if (!seleccionada) void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.opcion,
        seleccionada && styles.opcionActiva,
        deshabilitada && styles.opcionInactiva,
        pressed && styles.pressed,
        style,
      ]}>
      <Text
        variant={mono ? 'mono' : 'label'}
        tone={seleccionada ? color.onAccent : deshabilitada ? color.inkSoft : color.ink}
        style={tachada && styles.tachada}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

/* ---------- Fecha ---------- */

const ANCHO_FECHA = 52;
const PASO_FECHA = ANCHO_FECHA + space.sm;

type FechaChipsProps = {
  dias: string[];
  valor: string | null;
  onChange: (clave: string) => void;
  hoy: string;
};

/** Tira horizontal de días ('lun 16'). Se desplaza sola hasta el día elegido. */
export function FechaChips({ dias, valor, onChange, hoy }: FechaChipsProps) {
  const lista = useRef<FlatList<string>>(null);
  const indice = valor ? dias.indexOf(valor) : -1;

  useEffect(() => {
    if (indice > 0) lista.current?.scrollToIndex({ index: indice, animated: true, viewPosition: 0.5 });
  }, [indice]);

  return (
    <FlatList
      ref={lista}
      horizontal
      data={dias}
      keyExtractor={(d) => d}
      showsHorizontalScrollIndicator={false}
      style={styles.tira}
      contentContainerStyle={styles.tiraContenido}
      getItemLayout={(_, i) => ({ length: PASO_FECHA, offset: PASO_FECHA * i, index: i })}
      initialScrollIndex={indice > 2 ? indice - 2 : undefined}
      onScrollToIndexFailed={() => undefined}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => {
        const activa = item === valor;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fechaTitulo(item)}
            accessibilityState={{ selected: activa }}
            onPress={() => {
              if (!activa) void Haptics.selectionAsync();
              onChange(item);
            }}
            style={({ pressed }) => [styles.fecha, activa && styles.opcionActiva, pressed && styles.pressed]}>
            <Text variant="caption" tone={activa ? color.onAccent : color.inkSoft}>
              {item === hoy ? 'hoy' : diaAbreviado(item)}
            </Text>
            <Text variant="heading" tone={activa ? color.onAccent : color.ink}>
              {numeroDia(isoDesde(item))}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

/* ---------- Hora ---------- */

type HoraChipsProps = {
  horas: OpcionHora[];
  valor: string | null;
  onChange: (hora: string) => void;
};

const MOTIVO: Record<OpcionHora['estado'], string> = { libre: '', ocupada: ', ocupada', bloqueada: ', bloqueada' };

/** Cuadrícula de horas de inicio. Las ocupadas o bloqueadas se ven tachadas y no se pueden elegir. */
export function HoraChips({ horas, valor, onChange }: HoraChipsProps) {
  return (
    <View style={styles.cuadricula}>
      {horas.map((h) => (
        <Opcion
          key={h.hora}
          mono
          etiqueta={h.hora}
          seleccionada={h.hora === valor}
          deshabilitada={h.estado !== 'libre' && h.hora !== valor}
          tachada={h.estado !== 'libre'}
          accessibilityLabel={`${h.hora}${MOTIVO[h.estado]}`}
          onPress={() => onChange(h.hora)}
          style={styles.hora}
        />
      ))}
    </View>
  );
}

/** Grupo de opciones en fila que se parte en varias líneas. */
export function Opciones<T extends string | number>({
  opciones,
  valor,
  onChange,
}: {
  opciones: { valor: T; etiqueta: string }[];
  valor: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.cuadricula}>
      {opciones.map((o) => (
        <Opcion key={String(o.valor)} etiqueta={o.etiqueta} seleccionada={o.valor === valor} onPress={() => onChange(o.valor)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  opcion: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionActiva: { backgroundColor: color.ink, borderColor: color.ink },
  opcionInactiva: { backgroundColor: color.quiet, borderColor: color.quiet },
  tachada: { textDecorationLine: 'line-through' },
  pressed: { opacity: 0.7 },
  tira: { marginHorizontal: -space.xl, flexGrow: 0 },
  tiraContenido: { paddingHorizontal: space.xl },
  fecha: {
    width: ANCHO_FECHA,
    marginRight: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    alignItems: 'center',
    gap: 2,
  },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  hora: { minWidth: 76, paddingHorizontal: space.md },
});
