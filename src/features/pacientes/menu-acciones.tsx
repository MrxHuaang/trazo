import { useRef, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

export type AccionMenu = {
  etiqueta: string;
  icono: ReactNode;
  onPress: () => void;
};

type MenuAccionesProps = {
  visible: boolean;
  onCerrar: () => void;
  acciones: AccionMenu[];
};

/** Menú corto anclado arriba a la derecha (acciones de la ficha). Se cierra tocando fuera o con atrás. */
export function MenuAcciones({ visible, onCerrar, acciones }: MenuAccionesProps) {
  const insets = useSafeAreaInsets();
  // En iOS no se puede presentar una alerta o el menú de compartir mientras el modal se cierra:
  // la acción espera a onDismiss.
  const pendiente = useRef<(() => void) | null>(null);

  const elegir = (accion: () => void) => {
    if (Platform.OS === 'ios') {
      pendiente.current = accion;
      onCerrar();
    } else {
      onCerrar();
      accion();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCerrar}
      onDismiss={() => {
        const accion = pendiente.current;
        pendiente.current = null;
        accion?.();
      }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar menú" />
      <View style={[styles.menu, { top: insets.top + 52 }]} accessibilityRole="menu">
        {acciones.map((a, i) => (
          <Pressable
            key={a.etiqueta}
            accessibilityRole="menuitem"
            accessibilityLabel={a.etiqueta}
            onPress={() => elegir(a.onPress)}
            style={({ pressed }) => [styles.item, i > 0 && styles.divisor, pressed && styles.pressed]}>
            {a.icono}
            <Text variant="bodyMedium">{a.etiqueta}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    right: space.xl,
    minWidth: 240,
    backgroundColor: color.surface,
    borderRadius: radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 48,
    paddingHorizontal: space.lg,
  },
  divisor: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  pressed: { backgroundColor: color.quiet },
});
