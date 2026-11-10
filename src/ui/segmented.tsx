import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './text';

type SegmentedProps<T extends string> = {
  options: { valor: T; etiqueta: string }[];
  value: T;
  onChange: (valor: T) => void;
  accessibilityLabel?: string;
  className?: string;
};

/** Selector de opciones excluyentes en píldora (p. ej. presencial / virtual). */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel, className }: SegmentedProps<T>) {
  return (
    <View
      className={cn('flex-row flex-wrap gap-1 self-start rounded-[26px] bg-quiet p-1', className)}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const activo = o.valor === value;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            onPress={() => {
              if (!activo) void Haptics.selectionAsync();
              onChange(o.valor);
            }}
            className={cn('min-h-[44px] justify-center rounded-full px-4', activo && 'bg-ink')}>
            <Text variant="label" className={activo ? 'text-accent-on' : 'text-ink'}>
              {o.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
