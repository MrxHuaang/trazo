// Colores copiados a mano de src/theme/palette.js. Si cambia la paleta de la app, actualizar aqui.
export const COLOR = {
  lienzo: '#F6F7F9',
  tinta: '#17171C',
  gris: '#5E6068',
  linea: '#E3E5EA',
  acento: '#2340E0',
} as const;

export const TONOS = {
  lavanda: {fondo: '#D9D2FF', tinta: '#241A5C'},
  menta: {fondo: '#C6EFD9', tinta: '#0E3B26'},
  durazno: {fondo: '#FFD3BF', tinta: '#4A1D0B'},
  mantequilla: {fondo: '#FFEFA8', tinta: '#3D3102'},
} as const;

export type Tono = keyof typeof TONOS;

/** Margen lateral comun a todas las escenas. */
export const LIENZO = {ancho: 1920, alto: 1080, margen: 120} as const;

/** Medidas mientras corre la grabacion (texto a un lado, telefono al otro). */
export const DISPOSICION = {
  anchoPanel: 820,
  anchoTexto: 860,
  /** Tope del bloque de titulo durante la grabacion. */
  topeGrabacion: 176,
  /** Borde inferior que no cruza ningun texto. */
  pisoTexto: 944,
} as const;

/** En segundos. scripts/fotogramas.mjs tiene una copia en cuadros: cambiar ambos. */
export const TIEMPO = {
  portada: 6.5,
  tarjeta: 2.6,
  /** Lo que tarda la tarjeta en convertirse en la vista con telefono. */
  cambio: 1.0,
  stack: 10,
  cierre: 8.5,
  transicion: 1.2,
  /** Duracion del marcador cuando todavia no existe la grabacion. */
  marcador: 8,
} as const;

export const FPS = 30;
