import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

const RESORTE = { damping: 16, stiffness: 320, mass: 0.5 };

export type PresionableProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  className?: string;
  /** Clases del contenido animado (el que se hunde). */
  contentClassName?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Cuánto se hunde al presionar (0.97 = 3 %). */
  hundir?: number;
  haptico?: boolean;
};

/**
 * Base táctil de Trazo: se hunde con resorte al presionar y da un toque háptico leve.
 * Todos los elementos tocables (bloques, botones, filas) la usan para sentirse iguales.
 */
export function Presionable({
  children,
  className,
  contentClassName,
  style,
  contentStyle,
  hundir = 0.97,
  haptico = true,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PresionableProps) {
  const reducir = useReducedMotion();
  const escala = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      className={className}
      style={style}
      onPress={(e) => {
        if (haptico) void Haptics.selectionAsync();
        onPress?.(e);
      }}
      onPressIn={(e) => {
        if (!reducir) escala.set(withSpring(hundir, RESORTE));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        escala.set(withSpring(1, RESORTE));
        onPressOut?.(e);
      }}>
      <Animated.View className={contentClassName} style={[animado, contentStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
