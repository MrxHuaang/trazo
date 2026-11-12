import * as Haptics from 'expo-haptics';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space, tabBarInset } from '@/theme';

import { Text } from './text';

type FabProps = {
  label: string;
  onPress: () => void;
};

/** Botón flotante principal (único en la pantalla): píldora en tinta con círculo cobalto. */
export function Fab({ label, onPress }: FabProps) {
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          void Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
        <Text variant="bodyMedium" tone={color.onAccent}>
          {label}
        </Text>
        <View style={styles.circle}>
          <PlusIcon size={20} color={color.onAccent} weight="bold" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    bottom: tabBarInset + space.lg,
  },
  pill: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
    paddingLeft: space.xxl,
    paddingRight: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 10px 24px rgba(35, 64, 224, 0.22)',
  },
  pressed: { transform: [{ scale: 0.98 }] },
  circle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
