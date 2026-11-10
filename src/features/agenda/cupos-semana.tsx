import { StyleSheet, View } from 'react-native';

import { color, space, tile } from '@/theme';
import { HatchOverlay, Text } from '@/ui';

type Props = { usados: number; total: number };

/** Contador por segmentos (sin barra de progreso): cada cupo usado lleva el durazno con textura. */
export function CuposSemana({ usados, total }: Props) {
  const segmentos = Math.min(Math.max(total, usados), 10);
  const excedido = usados > total;
  const texto = excedido
    ? `${usados} de ${total} cupos solidarios esta semana, por encima de lo previsto`
    : `${usados} de ${total} cupos solidarios esta semana`;

  return (
    <View style={styles.fila} accessible accessibilityLabel={texto}>
      <View style={styles.segmentos}>
        {Array.from({ length: segmentos }, (_, i) => {
          const usado = i < usados;
          const extra = i >= total;
          return (
            <View key={i} style={[styles.segmento, usado && styles.usado, extra && styles.extra]}>
              {usado ? <HatchOverlay color={tile.solidario.fg} opacity={0.35} gap={4} /> : null}
            </View>
          );
        })}
      </View>
      <Text variant="label" tone={tile.solidario.fg} style={styles.texto}>
        {usados} de {total} cupos solidarios esta semana
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  segmentos: { flexDirection: 'row', gap: 3 },
  segmento: {
    width: 14,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: tile.solidario.fg,
    overflow: 'hidden',
  },
  usado: { backgroundColor: tile.solidario.bg },
  extra: { borderColor: color.danger },
  texto: { flexShrink: 1 },
});
