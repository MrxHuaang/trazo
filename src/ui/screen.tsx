import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { color, space, tabBarInset } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** Elementos flotantes (p. ej. el botón Agendar) que no hacen scroll. */
  overlay?: ReactNode;
};

/** Contenedor de pantalla: lienzo, márgenes seguros y espacio para la barra de pestañas. */
export function Screen({ children, overlay }: ScreenProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: tabBarInset + 96,
    gap: space.md,
  },
});
