import { StyleSheet } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

type HatchProps = {
  color: string;
  opacity?: number;
  gap?: number;
};

/**
 * Textura rayada a 45°: marca visual de lo solidario además del color,
 * para que ningún estado dependa solo del color (accesibilidad).
 */
export function HatchOverlay({ color, opacity = 0.12, gap = 7 }: HatchProps) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id="hatch" patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform="rotate(45)">
          <Line x1="0" y1="0" x2="0" y2={gap} stroke={color} strokeWidth={2} strokeOpacity={opacity} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#hatch)" />
    </Svg>
  );
}
