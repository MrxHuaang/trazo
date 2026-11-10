import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';
import type { TextVariant } from '@/theme';

const VARIANTE: Record<TextVariant, string> = {
  display: 'font-display text-display',
  number: 'font-display text-number',
  title: 'font-display text-title',
  heading: 'font-display-bold text-heading',
  bodyLarge: 'font-body text-body-lg',
  body: 'font-body text-body',
  bodyMedium: 'font-medium text-body',
  label: 'font-medium text-label',
  caption: 'font-body text-caption',
  mono: 'font-mono text-label',
};

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** Color puntual (valor de los tokens). Para lo demás, usa clases: `className="text-ink-soft"`. */
  tone?: string;
  className?: string;
};

/** Texto con la escala tipográfica de Trazo suave. Nunca usar <Text> de react-native directo. */
export function Text({ variant = 'body', tone, className, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      className={cn(VARIANTE[variant], 'text-ink', className)}
      style={tone ? [{ color: tone }, style] : style}
    />
  );
}
