import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetProps = {
  header: ReactNode;
  children: ReactNode;
  /** Botones fijos abajo, p. ej. Guardar. */
  footer?: ReactNode;
};

/** Base de las rutas tipo hoja: encabezado y pie fijos, contenido con scroll y teclado resuelto. */
export function Sheet({ header, children, footer }: SheetProps) {
  const insets = useSafeAreaInsets();

  // En Android la hoja es un modal, así que el botón atrás se maneja aquí para que cierre igual que la X.
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
      // En Android ocupa toda la pantalla y hay que bajar el contenido de la barra de estado.
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
