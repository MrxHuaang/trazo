import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { color, type, type TextVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** Color del texto; por defecto la tinta principal. */
  tone?: string;
};

/** Texto con la escala tipográfica de Trazo suave. Nunca usar <Text> de react-native directo. */
export function Text({ variant = 'body', tone = color.ink, style, ...rest }: TextProps) {
  return <RNText {...rest} style={[type[variant], { color: tone }, style]} />;
}
