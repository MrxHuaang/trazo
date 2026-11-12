import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior="padding">
      {header}
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8" keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? (
        <View className="gap-2 border-t border-line bg-canvas px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
