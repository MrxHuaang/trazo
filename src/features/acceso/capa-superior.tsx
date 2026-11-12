import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

type CapaSuperiorProps = {
  children: ReactNode;
  /** VoiceOver no recorre lo que queda debajo (bloqueo). */
  modal?: boolean;
};

/**
 * Capa opaca por encima de toda la app.
 * En iPhone las hojas (formSheet) se presentan en un controlador nativo por encima de la vista raíz,
 * así que una vista absoluta no las taparía: se usa FullWindowOverlay (react-native-screens, incluido
 * en Expo Go). En Android y web las hojas viven dentro de la vista raíz y basta una vista absoluta.
 */
export function CapaSuperior({ children, modal = false }: CapaSuperiorProps) {
  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay unstable_accessibilityContainerViewIsModal={modal}>
        <View className="absolute inset-0 bg-canvas">{children}</View>
      </FullWindowOverlay>
    );
  }
  return (
    <View className="absolute inset-0 z-[1000] bg-canvas" accessibilityViewIsModal={modal}>
      {children}
    </View>
  );
}
