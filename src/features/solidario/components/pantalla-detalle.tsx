import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonIcono } from './accion';

type PantallaDetalleProps = {
  children: ReactNode;
  /** Botones de ícono a la derecha de la barra (editar, eliminar…). */
  acciones?: ReactNode;
};

export const volverASolidario = () => (router.canGoBack() ? router.back() : router.replace('/solidario'));

/**
 * Pantalla apilada (fuera de las pestañas): barra con Volver respetando la zona segura,
 * contenido con scroll y espacio inferior para el indicador de inicio y el teclado.
 * Incluye la raíz de gestos para las filas que se deslizan.
 */
export function PantallaDetalle({ children, acciones }: PantallaDetalleProps) {
  const insets = useSafeAreaInsets();

  return (
    // GestureHandlerRootView no recibe className: es un componente nativo de la librería de gestos.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView className="flex-1 bg-canvas" behavior="padding">
        <View className="flex-row items-center justify-between px-4 pb-1" style={{ paddingTop: insets.top + 4 }}>
          <BotonIcono icon={CaretLeftIcon} label="Volver" onPress={volverASolidario} />
          <View className="flex-row gap-2">{acciones}</View>
        </View>
        <ScrollView
          contentContainerClassName="gap-3 px-5 pt-2"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}
