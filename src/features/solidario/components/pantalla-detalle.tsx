import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space } from '@/theme';

import { BotonIcono } from './accion';

type PantallaDetalleProps = {
  children: ReactNode;
  /** Botones de ícono a la derecha de la barra (editar, eliminar…). */
  acciones?: ReactNode;
};

/**
 * Pantalla apilada (fuera de las pestañas): barra con Volver respetando la zona segura,
 * contenido con scroll y espacio inferior para el indicador de inicio y el teclado.
 */
export function PantallaDetalle({ children, acciones }: PantallaDetalleProps) {
  const insets = useSafeAreaInsets();
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/solidario'));

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.barra, { paddingTop: insets.top + space.xs }]}>
        <BotonIcono icon={CaretLeftIcon} label="Volver" onPress={volver} />
        <View style={styles.acciones}>{acciones}</View>
      </View>
      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + space.xxxl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.xs,
  },
  acciones: { flexDirection: 'row', gap: space.sm },
  contenido: { paddingHorizontal: space.xl, paddingTop: space.sm, gap: space.md },
});
