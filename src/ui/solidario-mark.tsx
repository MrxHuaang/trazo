import { View } from 'react-native';

import { tile } from '@/theme';

import { HatchOverlay } from './hatch';

/** Marca pequeña de "cupo solidario": color durazno + textura rayada. */
export function SolidarioMark() {
  return (
    <View className="h-3.5 w-3.5 overflow-hidden rounded border border-durazno-ink bg-durazno" accessibilityLabel="Cupo solidario">
      <HatchOverlay color={tile.solidario.fg} opacity={0.5} gap={4} />
    </View>
  );
}
