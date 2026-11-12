import { router } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { color } from '@/theme';

import { Text } from './text';

type SheetHeaderProps = {
  title: string;
  subtitle?: string;
  /** Acción a la derecha (p. ej. botón Guardar). */
  action?: ReactNode;
  onClose?: () => void;
};

/** Encabezado de hojas (formSheet): título, cerrar y una acción. */
export function SheetHeader({ title, subtitle, action, onClose }: SheetHeaderProps) {
  return (
    <View className="gap-2 px-5 pb-3 pt-2">
      <View className="h-[5px] w-10 self-center rounded-full bg-line" />
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={8}
          onPress={onClose ?? (() => router.back())}
          className="h-11 w-11 items-center justify-center rounded-full bg-quiet active:opacity-60">
          <XIcon size={20} color={color.ink} />
        </Pressable>
        <View className="flex-1">
          <Text variant="heading" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View className="min-w-[36px] items-end">{action}</View>
      </View>
    </View>
  );
}
