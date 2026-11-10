import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, space } from '@/theme';
import { Text } from '@/ui';

type SeccionProps = {
  titulo: string;
  detalle?: string;
  /** Acción a la derecha del título (p. ej. "Ver todos"). */
  accion?: ReactNode;
};

/** Título de sección con una línea de contexto y una acción opcional. */
export function Seccion({ titulo, detalle, accion }: SeccionProps) {
  return (
    <View style={styles.fila}>
      <View style={styles.textos}>
        <Text variant="heading" accessibilityRole="header">
          {titulo}
        </Text>
        {detalle ? (
          <Text variant="caption" tone={color.inkSoft}>
            {detalle}
          </Text>
        ) : null}
      </View>
      {accion}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg },
  textos: { flex: 1, gap: 2 },
});
