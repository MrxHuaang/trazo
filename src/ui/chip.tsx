import { Pressable, StyleSheet } from 'react-native';

import { color, radius, space } from '@/theme';

import { Text } from './text';

type ChipProps = {
  label: string;
  /** `action`: texto cobalto sin borde. `outline`: píldora con borde de tinta. */
  kind?: 'action' | 'outline';
  onPress?: () => void;
};

export function Chip({ label, kind = 'action', onPress }: ChipProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [kind === 'outline' && styles.outline, pressed && styles.pressed]}>
      <Text variant="label" tone={kind === 'action' ? color.accent : color.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outline: {
    borderWidth: 1,
    borderColor: color.ink,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 3,
  },
  pressed: { opacity: 0.6 },
});
