import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space } from '@/theme';

type SheetProps = {
  header: ReactNode;
  children: ReactNode;
  /** Botones fijos abajo (p. ej. Guardar). */
  footer?: ReactNode;
};

/**
 * Contenedor de hojas (rutas con presentation 'formSheet'): encabezado fijo, contenido con scroll,
 * pie fijo y manejo de teclado en iOS y Android.
 */
export function Sheet({ header, children, footer }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxxl, gap: space.lg },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
    backgroundColor: color.canvas,
  },
});
