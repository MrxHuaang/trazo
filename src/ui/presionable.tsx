import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

const RESORTE = { damping: 16, stiffness: 320, mass: 0.5 };

export type PresionableProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  className?: string;
  /** Clases de la vista interna, que es la que se escala. */
  contentClassName?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Escala al presionar (0.97 = se hunde 3 %). */
  hundir?: number;
  haptico?: boolean;
};

/**
 * Base de todo lo tocable: se hunde con resorte y da un háptico leve.
 * La animación va en una vista interna porque NativeWind ignora `style` como función en Pressable.
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
