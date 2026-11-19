import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
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

  // Android: el botón atrás cierra la hoja desde JS, igual que la X.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!router.canGoBack()) return false;
      router.back();
      return true;
    });
    return () => sub.remove();
  }, []);
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior="padding"
      // En Android la hoja es una pantalla completa: deja libre la barra de estado.
      style={Platform.OS === 'android' ? { paddingTop: insets.top } : undefined}>
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
