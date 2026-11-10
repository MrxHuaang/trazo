import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { cn } from '@/lib/cn';
import { tile, type TileTone } from '@/theme';

import { HatchOverlay } from './hatch';
import { Presionable } from './presionable';

const FONDO: Record<TileTone, string> = {
  consulta: 'bg-lavanda',
  confirmar: 'bg-menta',
  solidario: 'bg-durazno',
  pagos: 'bg-mantequilla',
  neutral: 'bg-surface border border-line',
};

type TileProps = {
  tone?: TileTone;
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Clases de posición del bloque (flex, márgenes). */
  className?: string;
  /** Clases del interior (dirección, alineación). */
  contentClassName?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Bloque de color del mosaico. Cada tono corresponde a un tipo de información:
 * consulta (lavanda), confirmar (menta), solidario (durazno + textura), pagos (mantequilla).
 */
export function Tile({ tone = 'neutral', children, onPress, accessibilityLabel, className, contentClassName, style, contentStyle }: TileProps) {
  const interior = cn('grow overflow-hidden rounded-tile p-4', FONDO[tone], contentClassName);
  const textura = tone === 'solidario' ? <HatchOverlay color={tile.solidario.fg} /> : null;

  if (!onPress) {
    return (
      <View className={className} style={style}>
        <View className={interior} style={contentStyle}>
          {textura}
          {children}
        </View>
      </View>
    );
  }

  return (
    <Presionable
      className={className}
      style={style}
      contentClassName={interior}
      contentStyle={contentStyle}
      hundir={0.975}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}>
      {textura}
      {children}
    </Presionable>
  );
}
