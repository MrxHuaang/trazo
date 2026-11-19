import {loadFont as cargarBricolage} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as cargarGeist} from '@remotion/google-fonts/Geist';
import {loadFont as cargarGeistMono} from '@remotion/google-fonts/GeistMono';
import {loadFont as cargarInstrument} from '@remotion/google-fonts/InstrumentSerif';

const bricolage = cargarBricolage('normal', {weights: ['800'], subsets: ['latin', 'latin-ext']});
const geist = cargarGeist('normal', {weights: ['400', '500'], subsets: ['latin', 'latin-ext']});
const geistMono = cargarGeistMono('normal', {weights: ['400', '500'], subsets: ['latin', 'latin-ext']});
const instrument = cargarInstrument('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']});

export const FUENTE = {
  display: bricolage.fontFamily,
  texto: geist.fontFamily,
  mono: geistMono.fontFamily,
  serif: instrument.fontFamily,
} as const;

export const fuentesListas = Promise.all([
  bricolage.waitUntilDone(),
  geist.waitUntilDone(),
  geistMono.waitUntilDone(),
  instrument.waitUntilDone(),
]);
