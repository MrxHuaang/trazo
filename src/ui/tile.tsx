import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { color, radius, space, tile, type TileTone } from '@/theme';

import { HatchOverlay } from './hatch';

type TileProps = {
  tone?: TileTone;
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Estilo de posición (flex, márgenes). El aspecto del bloque lo define el tono. */
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const SPRING = { damping: 18, stiffness: 260, mass: 0.6 };

/**
 * Bloque de color del mosaico. Cada tono corresponde a un tipo de información:
 * consulta (lavanda), confirmar (menta), solidario (durazno + textura), pagos (mantequilla).
 */
export function Tile({ tone = 'neutral', children, onPress, accessibilityLabel, style, contentStyle }: TileProps) {
  const palette = tile[tone];
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const block = (
    <Animated.View
      style={[styles.base, { backgroundColor: palette.bg }, tone === 'neutral' && styles.outlined, animatedStyle, contentStyle]}>
      {tone === 'solidario' && <HatchOverlay color={palette.fg} />}
      {children}
    </Animated.View>
  );

  if (!onPress) return <View style={style}>{block}</View>;

  return (
    <Pressable
      style={style}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        if (!reduceMotion) scale.set(withSpring(0.98, SPRING));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, SPRING));
      }}>
      {block}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    borderRadius: radius.tile,
    padding: space.lg,
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
});
