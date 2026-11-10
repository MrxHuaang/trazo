import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { color } from '@/theme';
import { Aparecer, SolidarioMark, Text } from '@/ui';

import type { ItemHistoria, NodoHistoria } from './historia';
import { TrazoVertical } from './trazo-vertical';

/** Ancho de la columna del Trazo (clase `w-7`). */
const CANAL = 28;

type HistoriaLineaProps = {
  items: ItemHistoria[];
  onPressItem: (item: ItemHistoria) => void;
  onAbrirNota: (item: ItemHistoria) => void;
  /** Posición en la cascada de la pantalla a partir de la cual entran los ítems. */
  ordenInicial?: number;
};

/** Historia vertical: el Trazo corre por la izquierda y cada evento es un punto sobre él. */
export function HistoriaLinea({ items, onPressItem, onAbrirNota, ordenInicial = 0 }: HistoriaLineaProps) {
  const [alto, setAlto] = useState(0);

  return (
    <View onLayout={(e) => setAlto(Math.round(e.nativeEvent.layout.height))}>
      {alto > 0 ? <TrazoVertical alto={alto} ancho={CANAL} /> : null}
      {items.map((item, i) => (
        <Aparecer key={item.clave} orden={ordenInicial + i} reacomodar className="flex-row">
          <FilaHistoria item={item} onPress={onPressItem} onAbrirNota={onAbrirNota} />
        </Aparecer>
      ))}
    </View>
  );
}

const PISTA: Partial<Record<ItemHistoria['tipo'], string>> = {
  cita: 'Abre el detalle de la cita',
  nota: 'Pide huella o código',
  seguimiento: 'Marca el seguimiento',
  jornada: 'Abre la jornada',
};

function FilaHistoria({
  item,
  onPress,
  onAbrirNota,
}: {
  item: ItemHistoria;
  onPress: (item: ItemHistoria) => void;
  onAbrirNota: (item: ItemHistoria) => void;
}) {
  const tocable =
    item.tipo === 'cita' ||
    item.tipo === 'nota' ||
    item.tipo === 'jornada' ||
    (item.tipo === 'seguimiento' && item.seguimientoEstado === 'pendiente');

  return (
    <>
      {/* El centro del punto queda a la altura de la primera línea del título. */}
      <View className="w-7 items-center pt-[12.5px]">
        <Nodo tipo={item.nodo} />
      </View>
      <View className="flex-1 pl-2">
        <Pressable
          disabled={!tocable}
          onPress={() => onPress(item)}
          accessibilityRole={tocable ? 'button' : undefined}
          accessibilityLabel={`${item.titulo}. ${item.detalle}`}
          accessibilityHint={tocable ? PISTA[item.tipo] : undefined}
          className="min-h-[44px] gap-0.5 py-3 active:opacity-60">
          <View className="flex-row items-center gap-2">
            <Text variant="bodyMedium" className="shrink">
              {item.titulo}
            </Text>
            {item.solidaria ? <SolidarioMark /> : null}
          </View>
          <Text variant="caption" className="text-ink-soft">
            {item.detalle}
          </Text>
        </Pressable>
        {item.tipo === 'cita' && item.notaId ? (
          <Pressable
            onPress={() => onAbrirNota(item)}
            accessibilityRole="button"
            accessibilityLabel="Nota privada de esta sesión"
            accessibilityHint="Pide huella o código"
            hitSlop={{ top: 6, bottom: 6 }}
            className="-mt-1 mb-3 min-h-[32px] flex-row items-center gap-1 self-start rounded-full border border-ink px-3 active:opacity-60">
            <LockSimpleIcon size={14} color={color.ink} />
            <Text variant="label">Nota privada</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

/** Punto del evento: cobalto la próxima cita, tinta lo agendado, vacío lo pendiente, gris lo pasado. */
const NODO: Record<NodoHistoria, string> = {
  proxima: 'h-3.5 w-3.5 bg-accent',
  agendada: 'h-[11px] w-[11px] bg-ink',
  solicitada: 'h-[11px] w-[11px] border-[1.5px] border-ink bg-canvas',
  pendiente: 'h-[11px] w-[11px] border-[1.5px] border-ink bg-canvas',
  pasada: 'h-2 w-2 bg-ink-soft',
  falta: 'h-2.5 w-2.5 border-[1.5px] border-danger bg-canvas',
  cancelada: 'h-[9px] w-[9px] border-[1.5px] border-ink-soft bg-canvas',
};

function Nodo({ tipo }: { tipo: NodoHistoria }) {
  return (
    <View className="h-5 w-5 items-center justify-center rounded-full bg-canvas">
      {tipo === 'proxima' ? <Pulso /> : null}
      <View className={cn('rounded-full', NODO[tipo])} />
    </View>
  );
}

/** Onda que sale de la próxima cita cada 2,4 s: lo único que se repite en la pantalla. */
function Pulso() {
  const reducir = useReducedMotion();
  const pulso = useSharedValue(0);

  useEffect(() => {
    if (reducir) return;
    pulso.set(withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false));
    return () => pulso.set(0);
  }, [reducir, pulso]);

  const onda = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulso.get()),
    transform: [{ scale: 1 + pulso.get() * 1.6 }],
  }));

  return <Animated.View className="absolute h-3.5 w-3.5 rounded-full bg-accent" style={onda} />;
}
