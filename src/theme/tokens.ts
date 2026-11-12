/**
 * Sistema visual "Trazo suave".
 * Valores para SVG, Reanimated y APIs nativas; las pantallas usan clases de NativeWind
 * (tailwind.config.js). Los colores salen de palette.js, la única fuente.
 */
import { Platform } from 'react-native';

import { palette } from './palette';

export const color = {
  canvas: palette.canvas,
  surface: palette.surface,
  ink: palette.ink,
  inkSoft: palette.inkSoft,
  line: palette.line,
  accent: palette.accent,
  accentSoft: palette.accentSoft,
  onAccent: palette.onAccent,
  danger: palette.danger,
  dangerBg: palette.dangerBg,
  quiet: palette.quiet,
} as const;

/** Bloques: fondo pastel + texto oscuro de la misma familia (contraste > 7:1). */
export const tile = {
  consulta: { bg: palette.lavanda, fg: palette.lavandaInk },
  confirmar: { bg: palette.menta, fg: palette.mentaInk },
  solidario: { bg: palette.durazno, fg: palette.duraznoInk },
  pagos: { bg: palette.mantequilla, fg: palette.mantequillaInk },
  neutral: { bg: palette.surface, fg: palette.ink },
} as const;

export type TileTone = keyof typeof tile;

/** Nombres registrados con useFonts en el layout raíz. */
export const font = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  mono: 'GeistMono_500Medium',
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  number: { fontFamily: font.display, fontSize: 40, lineHeight: 42, letterSpacing: -1.2 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.6 },
  heading: { fontFamily: font.displayBold, fontSize: 18, lineHeight: 22, letterSpacing: -0.2 },
  bodyLarge: { fontFamily: font.body, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: font.medium, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: font.medium, fontSize: 13, lineHeight: 17 },
  caption: { fontFamily: font.body, fontSize: 12, lineHeight: 16 },
  mono: { fontFamily: font.mono, fontSize: 13, lineHeight: 17 },
} as const;

export type TextVariant = keyof typeof type;

export const radius = { tile: 22, field: 14, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** Espacio que ocupa la barra de pestañas sobre el contenido (iOS flota, Android es edge-to-edge). */
export const tabBarInset = Platform.select({ ios: 50, android: 80, default: 84 }) ?? 0;
