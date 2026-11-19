import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line } from 'react-native-svg';

type HatchProps = {
  color: string;
  opacity?: number;
  gap?: number;
};

/**
 * Rayado de lo solidario, para no depender solo del color.
 * Va con líneas medidas porque <Pattern> no cubría todo el bloque en Android.
 */
export function HatchOverlay({ color, opacity = 0.12, gap = 7 }: HatchProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.ceil(width), h: Math.ceil(height) });
  };

  const lines = [];
  if (size.w > 0) {
    for (let x = -size.h; x < size.w; x += gap) {
      lines.push(<Line key={x} x1={x} y1={size.h} x2={x + size.h} y2={0} stroke={color} strokeWidth={1.4} strokeOpacity={opacity} />);
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          {lines}
        </Svg>
      )}
    </View>
  );
}
