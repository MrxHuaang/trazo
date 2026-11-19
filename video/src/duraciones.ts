import {ALL_FORMATS, Input, UrlSource} from 'mediabunny';
import {staticFile, type CalculateMetadataFunction} from 'remotion';
import {SECCIONES} from './secciones';
import {TIEMPO} from './tema';

export type PropsTrazo = {
  /** Segundos de cada grabacion, en el orden de SECCIONES; null si falta el archivo. */
  readonly duraciones: (number | null)[];
};

/** Duracion de una grabacion en segundos, o null si todavia no esta en public/clips. */
const duracionClip = async (archivo: string): Promise<number | null> => {
  try {
    const input = new Input({formats: ALL_FORMATS, source: new UrlSource(staticFile(`clips/${archivo}`))});
    const segundos = await input.computeDuration();
    input.dispose();
    return Number.isFinite(segundos) && segundos > 0 ? segundos : null;
  } catch {
    return null;
  }
};

/** Cuadros de una seccion: tarjeta de titulo + grabacion (o marcador de 8 s). */
export const cuadrosSeccion = (segundos: number | null, fps: number) =>
  Math.round(TIEMPO.tarjeta * fps) + Math.ceil((segundos ?? TIEMPO.marcador) * fps);

export const cuadrosTotales = (duraciones: (number | null)[], fps: number) => {
  const escenas = [
    Math.round(TIEMPO.portada * fps),
    ...SECCIONES.map((_, i) => cuadrosSeccion(duraciones[i] ?? null, fps)),
    Math.round(TIEMPO.stack * fps),
    Math.round(TIEMPO.cierre * fps),
  ];
  const transicion = Math.round(TIEMPO.transicion * fps);
  return escenas.reduce((a, b) => a + b, 0) - transicion * (escenas.length - 1);
};

/** Lee la duracion real de cada clip para que el total cuadre solo. */
export const calcularMetadatos: CalculateMetadataFunction<PropsTrazo> = async ({props}) => {
  const duraciones = await Promise.all(SECCIONES.map((s) => duracionClip(s.archivo)));
  return {
    durationInFrames: cuadrosTotales(duraciones, 30),
    props: {...props, duraciones},
  };
};
