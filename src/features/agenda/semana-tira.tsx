import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View, type GestureResponderHandlers } from 'react-native';

import { diaSemanaCorto, isoDesde, numeroDia } from '@/lib/dates';
import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

import { fechaTitulo } from './rules';

type Props = {
  dias: string[];
  seleccionado: string;
  hoy: string;
  conteos: Record<string, number>;
  onSelect: (clave: string) => void;
  /** Gestos para deslizar a la semana anterior o siguiente. */
  panHandlers?: GestureResponderHandlers;
};

const textoCitas = (n: number) => (n === 0 ? 'sin citas' : n === 1 ? '1 cita' : `${n} citas`);

/** Tira de lunes a domingo: el día elegido en tinta, hoy con borde, y cuántas citas tiene cada día. */
export function SemanaTira({ dias, seleccionado, hoy, conteos, onSelect, panHandlers }: Props) {
  return (
    <View style={styles.tira} accessibilityHint="Desliza a los lados para cambiar de semana" {...panHandlers}>
      {dias.map((d) => {
        const activo = d === seleccionado;
        const esHoy = d === hoy;
        const n = conteos[d] ?? 0;
        return (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`${esHoy ? 'Hoy, ' : ''}${fechaTitulo(d)}, ${textoCitas(n)}`}
            accessibilityState={{ selected: activo }}
            onPress={() => {
              if (!activo) void Haptics.selectionAsync();
              onSelect(d);
            }}
            style={({ pressed }) => [styles.dia, pressed && styles.pressed]}>
            <Text variant="caption" tone={esHoy ? color.ink : color.inkSoft}>
              {diaSemanaCorto(d).toUpperCase()}
            </Text>
            <View style={[styles.numero, esHoy && styles.numeroHoy, activo && styles.numeroActivo]}>
              <Text variant="bodyMedium" tone={activo ? color.onAccent : color.ink}>
                {numeroDia(isoDesde(d))}
              </Text>
            </View>
            <View style={styles.puntos}>
              {Array.from({ length: Math.min(n, 4) }, (_, i) => (
                <View key={i} style={[styles.punto, activo && styles.puntoActivo]} />
              ))}
              {n > 4 ? <View style={[styles.mas, activo && styles.puntoActivo]} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tira: { flexDirection: 'row' },
  dia: { flex: 1, alignItems: 'center', gap: space.xs, paddingVertical: space.xs, minHeight: 64 },
  pressed: { opacity: 0.6 },
  numero: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  numeroHoy: { borderColor: color.ink },
  numeroActivo: { backgroundColor: color.ink, borderColor: color.ink },
  puntos: { flexDirection: 'row', gap: 3, height: 5, alignItems: 'center' },
  punto: { width: 5, height: 5, borderRadius: radius.pill, backgroundColor: color.inkSoft },
  puntoActivo: { backgroundColor: color.accent },
  mas: { width: 9, height: 3, borderRadius: radius.pill, backgroundColor: color.inkSoft },
});
