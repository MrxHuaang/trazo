import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { color } from '@/theme';
import { Button, Text } from '@/ui';

type AgregarHistoriaProps = {
  onAgendar: () => void;
  onNota: () => void;
  onSeguimiento: () => void;
};

/** Fila fantasma al final de la historia: se abre en el mismo lugar con lo que se puede agregar. */
export function AgregarHistoria({ onAgendar, onNota, onSeguimiento }: AgregarHistoriaProps) {
  const [abierta, setAbierta] = useState(false);
  const elegir = (accion: () => void) => () => {
    setAbierta(false);
    accion();
  };

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System)}
      className={cn('mt-2 rounded-tile border', abierta ? 'border-line bg-surface' : 'border-dashed border-ink-soft')}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar a la historia"
        accessibilityState={{ expanded: abierta }}
        onPress={() => setAbierta((v) => !v)}
        className="min-h-[52px] flex-row items-center justify-center gap-2 active:opacity-60">
        <View className={cn(abierta && 'rotate-45')}>
          <PlusIcon size={16} color={color.inkSoft} />
        </View>
        <Text variant="bodyMedium" className="text-ink-soft">
          {abierta ? 'Cerrar' : 'Agregar a la historia'}
        </Text>
      </Pressable>
      {abierta ? (
        <Animated.View
          entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)}
          className="flex-row flex-wrap justify-center gap-2 px-4 pb-4">
          <Button label="Agendar cita" size="sm" variant="secondary" onPress={elegir(onAgendar)} />
          <Button label="Nota de sesión" size="sm" variant="secondary" onPress={elegir(onNota)} />
          <Button label="Seguimiento en 7 días" size="sm" variant="secondary" onPress={elegir(onSeguimiento)} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
