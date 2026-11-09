import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme';

import { Text } from './text';

type SegmentedProps<T extends string> = {
  options: { valor: T; etiqueta: string }[];
  value: T;
  onChange: (valor: T) => void;
  accessibilityLabel?: string;
};

/** Selector de opciones excluyentes en píldora (p. ej. presencial / virtual). */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
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
            style={[styles.item, activo && styles.activo]}>
            <Text variant="label" tone={activo ? color.onAccent : color.ink}>
              {o.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    padding: space.xs,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
    alignSelf: 'flex-start',
  },
  item: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill },
  activo: { backgroundColor: color.ink },
});
