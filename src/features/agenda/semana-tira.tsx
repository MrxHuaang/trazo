import * as Haptics from 'expo-haptics';
import { Pressable, View, type GestureResponderHandlers } from 'react-native';

import { cn } from '@/lib/cn';
import { diaSemanaCorto, numeroDia } from '@/lib/dates';
import { Text } from '@/ui';

import { fechaTitulo } from './rules';

type Props = {
  dias: string[];
  seleccionado: string;
  hoy: string;
  conteos: Record<string, number>;
  onSelect: (clave: string) => void;
  /** Gestos para deslizar a la semana anterior o siguiente. */
  panHandlers?: GestureResponderHandlers;
};

const textoCitas = (n: number) => (n === 0 ? 'sin citas' : n === 1 ? '1 cita' : `${n} citas`);

/** Tira de lunes a domingo: el día elegido en tinta, hoy con borde, y cuántas citas tiene cada día. */
export function SemanaTira({ dias, seleccionado, hoy, conteos, onSelect, panHandlers }: Props) {
  return (
    <View className="flex-row" {...panHandlers}>
      {dias.map((d) => {
        const activo = d === seleccionado;
        const esHoy = d === hoy;
        const n = conteos[d] ?? 0;
        return (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`${esHoy ? 'Hoy, ' : ''}${fechaTitulo(d)}, ${textoCitas(n)}`}
            accessibilityState={{ selected: activo }}
            onPress={() => {
              if (!activo) void Haptics.selectionAsync();
              onSelect(d);
            }}
            className="min-h-[64px] flex-1 items-center gap-1 py-1 active:opacity-60">
            <Text variant="caption" className={esHoy ? 'text-ink' : 'text-ink-soft'}>
              {diaSemanaCorto(d).toUpperCase()}
            </Text>
            <View
              className={cn(
                'h-9 w-9 items-center justify-center rounded-full border-[1.5px]',
                activo ? 'border-ink bg-ink' : esHoy ? 'border-ink' : 'border-transparent',
              )}>
              <Text variant="bodyMedium" className={activo ? 'text-accent-on' : 'text-ink'}>
                {numeroDia(d)}
              </Text>
            </View>
            <View className="h-[5px] flex-row items-center gap-[3px]">
              {Array.from({ length: Math.min(n, 4) }, (_, i) => (
                <View key={i} className={cn('h-[5px] w-[5px] rounded-full', activo ? 'bg-accent' : 'bg-ink-soft')} />
              ))}
              {n > 4 ? <View className={cn('h-[3px] w-[9px] rounded-full', activo ? 'bg-accent' : 'bg-ink-soft')} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
