import { StyleSheet, View } from 'react-native';

import { tile } from '@/theme';

import { HatchOverlay } from './hatch';

/** Marca pequeña de "cupo solidario": color durazno + textura rayada. */
export function SolidarioMark() {
  return (
    <View style={styles.mark} accessibilityLabel="Cupo solidario">
      <HatchOverlay color={tile.solidario.fg} opacity={0.5} gap={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: tile.solidario.bg,
    borderWidth: 1,
    borderColor: tile.solidario.fg,
    overflow: 'hidden',
  },
});
