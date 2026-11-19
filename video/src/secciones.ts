import type {Tono} from './tema';

/**
 * Contenido del video. Editar aqui los textos.
 * - `titulo`: admite "\n" para partir la linea a mano.
 * - `apoyo`: una palabra entre asteriscos (*asi*) sale en Instrument Serif italica.
 * - `etiquetas`: 2 o 3, cortas. Los codigos HU-xx / RN-xx salen en mono cobalto.
 * - `momentos`: segundos dentro de la grabacion en que aparece cada etiqueta.
 *   Si se omite, se reparten solas a lo largo del clip.
 */
export type Seccion = {
  numero: string;
  archivo: string;
  modulo: string;
  titulo: string;
  apoyo: string;
  etiquetas: string[];
  tono: Tono;
  momentos?: number[];
};

export const PORTADA = {
  titulo: 'Trazo',
  apoyo: 'Agenda de consulta y programa solidario después del *sismo* de Pereira.',
  etiquetas: ['Expo SDK 58', 'React Native', 'Desarrollo Móvil 2'],
};

export const SECCIONES: Seccion[] = [
  {
    numero: '01',
    archivo: '01-bienvenida.mp4',
    modulo: 'Acceso',
    titulo: 'Bienvenida',
    apoyo: 'Un sismógrafo que *reacciona* al teléfono.',
    etiquetas: ['Carrusel', 'Acelerómetro', 'Datos de demostración'],
    tono: 'lavanda',
  },
  {
    numero: '02',
    archivo: '02-hoy.mp4',
    modulo: 'Hoy',
    titulo: 'Hoy',
    apoyo: 'El día de un *vistazo*.',
    etiquetas: ['Próxima cita con cuenta regresiva', 'Trazo interactivo', 'Bloques por color'],
    tono: 'mantequilla',
  },
  {
    numero: '03',
    archivo: '03-semana.mp4',
    modulo: 'Hoy',
    titulo: 'Tu semana',
    apoyo: 'El resumen en *historias*.',
    etiquetas: ['reanimated-carousel', 'Cifras que cuentan'],
    tono: 'mantequilla',
  },
  {
    numero: '04',
    archivo: '04-agenda.mp4',
    modulo: 'Agenda',
    titulo: 'Agenda',
    apoyo: 'Arrastrar para *reprogramar*.',
    etiquetas: ['Pasos de 15 min', 'RN-01 sin choques', 'Deshacer'],
    tono: 'menta',
  },
  {
    numero: '05',
    archivo: '05-nueva-cita.mp4',
    modulo: 'Agenda',
    titulo: 'Nueva cita',
    apoyo: 'Se agenda tocando un *hueco*.',
    etiquetas: ['Hoja inferior', 'Cupo solidario RN-03'],
    tono: 'menta',
  },
  {
    numero: '06',
    archivo: '06-pacientes.mp4',
    modulo: 'Pacientes',
    titulo: 'Pacientes',
    apoyo: 'Buscar, filtrar, *deslizar*.',
    etiquetas: ['Zustand', 'Filas deslizables', 'WhatsApp'],
    tono: 'lavanda',
  },
  {
    numero: '07',
    archivo: '07-ficha.mp4',
    modulo: 'Pacientes',
    titulo: 'Ficha',
    apoyo: 'La historia como una *línea*.',
    etiquetas: ['Asistencia de un vistazo', 'Notas bajo bloqueo'],
    tono: 'lavanda',
  },
  {
    numero: '08',
    archivo: '08-solidario.mp4',
    modulo: 'Solidario',
    titulo: 'Solidario',
    apoyo: 'El programa *post-sismo*.',
    etiquetas: ['Cupos semanales', 'Jornadas', 'Seguimientos'],
    tono: 'durazno',
  },
  {
    numero: '09',
    archivo: '09-mapa.mp4',
    modulo: 'Solidario',
    titulo: 'Mapa y\nsismos',
    apoyo: 'Datos públicos, sin datos de *pacientes*.',
    etiquetas: ['Leaflet + WebView', 'expo-location', 'USGS con axios'],
    tono: 'durazno',
  },
  {
    numero: '10',
    archivo: '10-pagos.mp4',
    modulo: 'Hoy',
    titulo: 'Pagos',
    apoyo: 'Cobros claros, PDF del *mes*.',
    etiquetas: ['TanStack Query', 'expo-print'],
    tono: 'mantequilla',
  },
  {
    numero: '11',
    archivo: '11-ajustes.mp4',
    modulo: 'Acceso',
    titulo: 'Ajustes',
    apoyo: 'Todo vive en el *teléfono*.',
    etiquetas: ['SQLite local-first', 'Bloqueo biométrico'],
    tono: 'lavanda',
  },
];

export const STACK = {
  titulo: 'Cómo está hecho',
  apoyo: 'Stack del curso y *extras*.',
  lista: [
    'Expo Router',
    'NativeWind + Tailwind',
    'TanStack Query + axios',
    'Zustand',
    'Reanimated + Gesture Handler',
    'Leaflet + expo-location',
    'SQLite',
  ],
  cifras: [
    {valor: '5', nombre: 'módulos'},
    {valor: '0', nombre: 'servidores'},
    {valor: '$0', nombre: 'de costo'},
  ],
};

export const CIERRE = {
  titulo: 'Gracias',
  autor: 'Juan José Pantoja Ordoñez',
  enlace: 'github.com/MrxHuaang/trazo',
};
