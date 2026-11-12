import * as Haptics from 'expo-haptics';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { color, tile } from '@/theme';
import { Presionable, Text } from '@/ui';

type StepperProps = {
  label: string;
  value: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
  /** Paso al mantener presionado (p. ej. 5 para cupos de una jornada). */
  pasoLargo?: number;
  /** Texto bajo el número (p. ej. "por semana"). */
  unidad?: string;
  /** ink: sobre el lienzo · durazno: dentro del bloque solidario. */
  tono?: 'ink' | 'durazno';
};

/** Contador − / + con el número grande en el centro. Ajustable con lectores de pantalla. */
export function Stepper({ label, value, onChange, min = 0, max = 99, pasoLargo, unidad, tono = 'ink' }: StepperProps) {
  const texto = tono === 'durazno' ? 'text-durazno-ink' : 'text-ink';
  const borde = tono === 'durazno' ? 'border-durazno-ink' : 'border-ink';
  const icono = tono === 'durazno' ? tile.solidario.fg : color.ink;

  const cambiar = (delta: number) => {
    const siguiente = Math.min(max, Math.max(min, value + delta));
    if (siguiente === value) return;
    void Haptics.selectionAsync();
    onChange(siguiente);
  };

  const boton = (inactivo: boolean) => cn('h-12 w-12 items-center justify-center rounded-full border', borde, inactivo && 'opacity-30');

  return (
    <View
      className="flex-row items-center gap-4"
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: unidad ? `${value} ${unidad}` : String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => cambiar(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <Presionable
        haptico={false}
        hundir={0.9}
        disabled={value <= min}
        onPress={() => cambiar(-1)}
        onLongPress={pasoLargo ? () => cambiar(-pasoLargo) : undefined}
        contentClassName={boton(value <= min)}>
        <MinusIcon size={20} color={icono} weight="bold" />
      </Presionable>
      <View className="flex-1 items-center">
        <Text variant="number" className={texto}>
          {value}
        </Text>
        {unidad ? (
          <Text variant="caption" className={texto}>
            {unidad}
          </Text>
        ) : null}
      </View>
      <Presionable
        haptico={false}
        hundir={0.9}
        disabled={value >= max}
        onPress={() => cambiar(1)}
        onLongPress={pasoLargo ? () => cambiar(pasoLargo) : undefined}
        contentClassName={boton(value >= max)}>
        <PlusIcon size={20} color={icono} weight="bold" />
      </Presionable>
    </View>
  );
}
