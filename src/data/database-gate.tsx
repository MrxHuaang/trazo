import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, space } from '@/theme';
import { Text, TraceLine } from '@/ui';

import { migrar } from './db';

/** Aplica migraciones antes de mostrar la app. */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    migrar()
      .then(() => setListo(true))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) {
    return (
      <View style={styles.wrap}>
        <Text variant="heading">No se pudo abrir la base de datos</Text>
        <Text variant="body" tone={color.inkSoft}>{error}</Text>
      </View>
    );
  }
  if (!listo) {
    return (
      <View style={styles.wrap}>
        <TraceLine height={40} />
      </View>
    );
  }
  return children;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: space.xxl, gap: space.sm, backgroundColor: color.canvas },
});
