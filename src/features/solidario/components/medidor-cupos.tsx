import { StyleSheet, View } from 'react-native';

type MedidorCuposProps = {
  usados: number;
  total: number;
  /** Color de los segmentos (el tono oscuro del bloque donde va). */
  tone: string;
};

/**
 * Medidor por segmentos: un segmento por cupo, lleno si ya se usó.
 * No es una barra con fondo: cada cupo es una pieza separada con borde, así se lee sin depender del color.
 */
export function MedidorCupos({ usados, total, tone }: MedidorCuposProps) {
  if (total <= 0) return null;
  const llenos = Math.min(usados, total);
  return (
    <View
      style={styles.fila}
      accessible
      accessibilityLabel="Cupos solidarios usados"
      accessibilityValue={{ min: 0, max: total, now: llenos, text: `${usados} de ${total}` }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.segmento, { borderColor: tone }, i < llenos && { backgroundColor: tone }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 5 },
  segmento: { flex: 1, height: 10, borderRadius: 5, borderWidth: 1.2 },
});
