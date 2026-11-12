import { useRef, type ReactNode } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
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

/** Alto de la barra superior de la ficha: el menú cuelga justo debajo. */
const ALTO_BARRA = 52;

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
      <Pressable className="absolute inset-0" onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar menú" />
      <View
        className="absolute right-5 min-w-[240px] overflow-hidden rounded-field border border-line bg-surface"
        style={{ top: insets.top + ALTO_BARRA }}
        accessibilityRole="menu">
        {acciones.map((a, i) => (
          <Pressable
            key={a.etiqueta}
            accessibilityRole="menuitem"
            accessibilityLabel={a.etiqueta}
            onPress={() => elegir(a.onPress)}
            className={cn('min-h-[48px] flex-row items-center gap-3 px-4 active:bg-quiet', i > 0 && 'border-t border-line')}>
            {a.icono}
            <Text variant="bodyMedium">{a.etiqueta}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
