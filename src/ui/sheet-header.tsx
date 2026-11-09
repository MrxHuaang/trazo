import { router } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme';

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
    <View style={styles.wrap}>
      <View style={styles.grip} />
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={10}
          onPress={onClose ?? (() => router.back())}
          style={styles.close}>
          <XIcon size={20} color={color.ink} />
        </Pressable>
        <View style={styles.titles}>
          <Text variant="heading" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone={color.inkSoft} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.action}>{action}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: space.sm, paddingBottom: space.md, paddingHorizontal: space.xl, gap: space.sm },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: radius.pill, backgroundColor: color.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  close: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: color.quiet, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1 },
  action: { minWidth: 36, alignItems: 'flex-end' },
});
