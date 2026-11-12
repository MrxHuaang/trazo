import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, space } from '@/theme';

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
};

/** Fila de lista: hora en mono, título y una acción a la derecha. */
export function ListRow({ lead, title, subtitle, badge, trailing, onPress, last }: ListRowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}>
      {lead ? (
        <Text variant="mono" tone={color.inkSoft} style={styles.lead}>
          {lead}
        </Text>
      ) : null}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {badge}
        </View>
        {subtitle ? (
          <Text variant="caption" tone={color.inkSoft} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    minHeight: 52,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  pressed: { opacity: 0.6 },
  lead: { width: 46 },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flexShrink: 1 },
});
