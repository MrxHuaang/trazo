import type { ReactNode } from 'react';
import { Pressable, View, type AccessibilityActionEvent, type AccessibilityActionInfo } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './text';

type ListRowProps = {
  /** Hora o etiqueta corta en Geist Mono a la izquierda. */
  lead?: string;
  title: string;
  subtitle?: string;
  /** Marca a la derecha del título (p. ej. textura solidaria). */
  badge?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  className?: string;
  /** Lo que lee el lector de pantalla en lugar del texto visible. */
  accessibilityLabel?: string;
  /** Acciones de los gestos (p. ej. deslizar) para el lector de pantalla. */
  accessibilityActions?: AccessibilityActionInfo[];
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
};

/** Fila de lista: hora en mono, título y una acción a la derecha. */
export function ListRow({
  lead,
  title,
  subtitle,
  badge,
  trailing,
  onPress,
  last,
  className,
  accessibilityLabel,
  accessibilityActions,
  onAccessibilityAction,
}: ListRowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      className={cn('min-h-[56px] flex-row items-center gap-3 py-3 active:opacity-60', !last && 'border-b border-line', className)}>
      {lead ? (
        <Text variant="mono" className="w-[46px] text-ink-soft">
          {lead}
        </Text>
      ) : null}
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text variant="bodyMedium" numberOfLines={1} className="shrink">
            {title}
          </Text>
          {badge}
        </View>
        {subtitle ? (
          <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}
