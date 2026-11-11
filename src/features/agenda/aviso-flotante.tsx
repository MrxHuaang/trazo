import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';

import { tabBarInset } from '@/theme';
import { Text } from '@/ui';

export type Aviso = {
  /** Cambia con cada aviso: reinicia el temporizador y la animación. */
  id: number;
  texto: string;
  accion?: { etiqueta: string; alPresionar: () => void };
};

type Props = {
  aviso: Aviso | null;
  onCerrar: () => void;
  duracionMs?: number;
};

/**
 * Chip flotante sobre la barra de pestañas: explica por qué algo no se pudo o deja deshacer
 * el último cambio durante unos segundos. Se va solo.
 */
export function AvisoFlotante({ aviso, onCerrar, duracionMs = 5000 }: Props) {
  const id = aviso?.id;

  useEffect(() => {
    if (id === undefined) return;
    const t = setTimeout(onCerrar, duracionMs);
    return () => clearTimeout(t);
  }, [id, duracionMs, onCerrar]);

  if (!aviso) return null;

  return (
    <View pointerEvents="box-none" className="absolute left-5 right-5 items-center" style={{ bottom: tabBarInset + 16 }}>
      <Animated.View
        key={aviso.id}
        entering={FadeInDown.springify().damping(18).reduceMotion(ReduceMotion.System)}
        exiting={FadeOutDown.duration(160).reduceMotion(ReduceMotion.System)}
        className="min-h-[48px] max-w-full flex-row items-center gap-3 rounded-full bg-ink py-1 pl-5 pr-2"
        accessibilityLiveRegion="polite">
        <Text variant="label" className="shrink py-2 text-accent-on" accessibilityRole="alert">
          {aviso.texto}
        </Text>
        {aviso.accion ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={aviso.accion.etiqueta}
            onPress={aviso.accion.alPresionar}
            hitSlop={6}
            className="min-h-[40px] justify-center rounded-full bg-surface px-4 active:opacity-70">
            <Text variant="label" className="text-ink">
              {aviso.accion.etiqueta}
            </Text>
          </Pressable>
        ) : (
          <View className="w-3" />
        )}
      </Animated.View>
    </View>
  );
}
