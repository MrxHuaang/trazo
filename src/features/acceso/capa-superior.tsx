import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

type CapaSuperiorProps = {
  children: ReactNode;
  /** Que VoiceOver no recorra lo que queda debajo. */
  modal?: boolean;
};

/**
 * En iOS las formSheet van en un controlador nativo encima de la raíz y una vista absoluta no las tapa,
 * por eso FullWindowOverlay (viene en Expo Go). En Android basta una vista absoluta.
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
