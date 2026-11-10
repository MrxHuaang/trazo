import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme';
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
    <View style={[styles.wrap, abierta && styles.abierta]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar a la historia"
        accessibilityState={{ expanded: abierta }}
        onPress={() => setAbierta((v) => !v)}
        style={({ pressed }) => [styles.cabeza, pressed && styles.pressed]}>
        <PlusIcon size={16} color={color.inkSoft} style={abierta ? styles.girado : undefined} />
        <Text variant="bodyMedium" tone={color.inkSoft}>
          {abierta ? 'Cerrar' : 'Agregar a la historia'}
        </Text>
      </Pressable>
      {abierta ? (
        <View style={styles.opciones}>
          <Button label="Agendar cita" size="sm" variant="secondary" onPress={elegir(onAgendar)} />
          <Button label="Nota de sesión" size="sm" variant="secondary" onPress={elegir(onNota)} />
          <Button label="Seguimiento en 7 días" size="sm" variant="secondary" onPress={elegir(onSeguimiento)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.inkSoft,
    borderRadius: radius.tile,
    marginTop: space.sm,
  },
  abierta: { borderStyle: 'solid', borderColor: color.line, backgroundColor: color.surface },
  cabeza: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  girado: { transform: [{ rotate: '45deg' }] },
  pressed: { opacity: 0.6 },
  opciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
});
