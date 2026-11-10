import { StyleSheet, View } from 'react-native';

import { radius, space } from '@/theme';

type SegmentosProps = {
  usados: number;
  total: number;
  /** Color del bloque donde se dibuja (tono oscuro de su familia). */
  tono: string;
};

/**
 * Contador por segmentos (sin barra de progreso): un segmento por cupo, relleno si está usado.
 * Es decorativo: el número del bloque ya lo anuncia el lector de pantalla.
 */
export function Segmentos({ usados, total, tono }: SegmentosProps) {
  if (total <= 0) return null;
  return (
    <View style={styles.fila} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.segmento, { borderColor: tono }, i < usados && { backgroundColor: tono }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: space.xs, marginTop: space.sm },
  segmento: { flex: 1, height: 8, borderRadius: radius.pill, borderWidth: 1.5, maxWidth: 40 },
});
