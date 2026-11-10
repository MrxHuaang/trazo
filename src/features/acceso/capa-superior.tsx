import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import { color } from '@/theme';

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
        <View style={styles.capa}>{children}</View>
      </FullWindowOverlay>
    );
  }
  return (
    <View style={[styles.capa, styles.encima]} accessibilityViewIsModal={modal}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { ...StyleSheet.absoluteFill, backgroundColor: color.canvas },
  encima: { zIndex: 1000, elevation: 1000 },
});
