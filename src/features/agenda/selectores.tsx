/**
 * Selectores propios con chips (no hay datetimepicker en Expo Go sin compilar):
 * fecha en tira horizontal, hora en cuadrícula de 30 min y opciones sueltas.
 */
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { numeroDia } from '@/lib/dates';
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
  className?: string;
};

/** Píldora seleccionable: tinta cuando está elegida, borde suave cuando no. */
export function Opcion({ etiqueta, seleccionada, onPress, deshabilitada, tachada, mono, accessibilityLabel, className }: OpcionProps) {
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
      className={cn(
        'min-h-[44px] items-center justify-center rounded-full border px-4 active:opacity-70',
        seleccionada ? 'border-ink bg-ink' : deshabilitada ? 'border-quiet bg-quiet' : 'border-line bg-surface',
        className,
      )}>
      <Text
        variant={mono ? 'mono' : 'label'}
        className={cn(seleccionada ? 'text-accent-on' : deshabilitada ? 'text-ink-soft' : 'text-ink', tachada && 'line-through')}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

/* ---------- Fecha ---------- */

const PASO_FECHA = 52 + 8;

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
      className="-mx-5 grow-0"
      contentContainerClassName="px-5"
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
            className={cn(
              'mr-2 w-[52px] items-center gap-0.5 rounded-full border py-2 active:opacity-70',
              activa ? 'border-ink bg-ink' : 'border-line bg-surface',
            )}>
            <Text variant="caption" className={activa ? 'text-accent-on' : 'text-ink-soft'}>
              {item === hoy ? 'hoy' : diaAbreviado(item)}
            </Text>
            <Text variant="heading" className={activa ? 'text-accent-on' : 'text-ink'}>
              {numeroDia(item)}
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
    <View className="flex-row flex-wrap gap-2">
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
          className="min-w-[76px] px-3"
        />
      ))}
    </View>
  );
}

const PASO_HORA = 72 + 8;

/** Tira horizontal de horas ('08:00') para elegir el inicio o el fin de una franja. */
export function HoraTira({ horas, valor, onChange, etiqueta }: { horas: string[]; valor: string; onChange: (h: string) => void; etiqueta: string }) {
  const lista = useRef<FlatList<string>>(null);
  const indice = horas.indexOf(valor);

  useEffect(() => {
    if (indice > 0) lista.current?.scrollToIndex({ index: indice, animated: true, viewPosition: 0.5 });
  }, [indice]);

  return (
    <FlatList
      ref={lista}
      horizontal
      data={horas}
      keyExtractor={(h) => h}
      showsHorizontalScrollIndicator={false}
      className="-mx-5 grow-0"
      contentContainerClassName="px-5"
      getItemLayout={(_, i) => ({ length: PASO_HORA, offset: PASO_HORA * i, index: i })}
      initialScrollIndex={indice > 1 ? indice - 1 : undefined}
      onScrollToIndexFailed={() => undefined}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel={etiqueta}
      renderItem={({ item }) => (
        <Opcion
          mono
          etiqueta={item}
          accessibilityLabel={`${etiqueta} ${item}`}
          seleccionada={item === valor}
          onPress={() => onChange(item)}
          className="mr-2 w-[72px] px-0"
        />
      )}
    />
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
    <View className="flex-row flex-wrap gap-2">
      {opciones.map((o) => (
        <Opcion key={String(o.valor)} etiqueta={o.etiqueta} seleccionada={o.valor === valor} onPress={() => onChange(o.valor)} />
      ))}
    </View>
  );
}
