const { palette } = require('./src/theme/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: palette.canvas,
        surface: palette.surface,
        ink: { DEFAULT: palette.ink, soft: palette.inkSoft },
        line: palette.line,
        accent: { DEFAULT: palette.accent, soft: palette.accentSoft, on: palette.onAccent },
        danger: { DEFAULT: palette.danger, bg: palette.dangerBg },
        quiet: palette.quiet,
        lavanda: { DEFAULT: palette.lavanda, ink: palette.lavandaInk },
        menta: { DEFAULT: palette.menta, ink: palette.mentaInk },
        durazno: { DEFAULT: palette.durazno, ink: palette.duraznoInk },
        mantequilla: { DEFAULT: palette.mantequilla, ink: palette.mantequillaInk },
      },
      fontFamily: {
        display: ['BricolageGrotesque_800ExtraBold'],
        'display-bold': ['BricolageGrotesque_700Bold'],
        body: ['Geist_400Regular'],
        medium: ['Geist_500Medium'],
        semibold: ['Geist_600SemiBold'],
        mono: ['GeistMono_500Medium'],
      },
      borderRadius: {
        tile: '22px',
        field: '14px',
      },
      fontSize: {
        // Escala tipográfica de Trazo suave: [tamaño, interlínea]
        display: ['34px', { lineHeight: '38px', letterSpacing: '-1px' }],
        number: ['40px', { lineHeight: '42px', letterSpacing: '-1.2px' }],
        title: ['26px', { lineHeight: '30px', letterSpacing: '-0.6px' }],
        heading: ['18px', { lineHeight: '22px', letterSpacing: '-0.2px' }],
        'body-lg': ['16px', { lineHeight: '22px' }],
        body: ['15px', { lineHeight: '21px' }],
        label: ['13px', { lineHeight: '17px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
    },
  },
  plugins: [],
};
