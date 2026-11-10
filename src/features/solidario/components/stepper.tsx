import * as Haptics from 'expo-haptics';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

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
  /** Color del número y de los botones (el tono oscuro del bloque donde va). */
  tone?: string;
};

/** Contador − / + con el número grande en el centro. Ajustable con lectores de pantalla. */
export function Stepper({ label, value, onChange, min = 0, max = 99, pasoLargo, unidad, tone = color.ink }: StepperProps) {
  const cambiar = (delta: number) => {
    const siguiente = Math.min(max, Math.max(min, value + delta));
    if (siguiente === value) return;
    void Haptics.selectionAsync();
    onChange(siguiente);
  };

  return (
    <View
      style={styles.fila}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: unidad ? `${value} ${unidad}` : String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => cambiar(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <Pressable
        onPress={() => cambiar(-1)}
        onLongPress={pasoLargo ? () => cambiar(-pasoLargo) : undefined}
        disabled={value <= min}
        style={({ pressed }) => [styles.boton, { borderColor: tone }, pressed && styles.pressed, value <= min && styles.inactivo]}>
        <MinusIcon size={20} color={tone} weight="bold" />
      </Pressable>
      <View style={styles.valor}>
        <Text variant="number" tone={tone}>
          {value}
        </Text>
        {unidad ? (
          <Text variant="caption" tone={tone}>
            {unidad}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => cambiar(1)}
        onLongPress={pasoLargo ? () => cambiar(pasoLargo) : undefined}
        disabled={value >= max}
        style={({ pressed }) => [styles.boton, { borderColor: tone }, pressed && styles.pressed, value >= max && styles.inactivo]}>
        <PlusIcon size={20} color={tone} weight="bold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  boton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: { flex: 1, alignItems: 'center' },
  pressed: { opacity: 0.6 },
  inactivo: { opacity: 0.35 },
});
