import {fitText, measureText} from '@remotion/layout-utils';
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {FUENTE, fuentesListas} from './fuentes';

/** Frena el render hasta tener las fuentes; si no, fitText mide con la fuente de respaldo. */
export const useFuentesListas = () => {
  const [handle] = useState(() => delayRender('Cargando fuentes'));
  const [listas, setListas] = useState(false);
  useEffect(() => {
    fuentesListas
      .then(() => {
        setListas(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return listas;
};

export const TRACKING_DISPLAY = '-0.045em';
export const ALTO_LINEA_DISPLAY = 0.94;

/** Tamano mas grande (sin pasar `maximo`) en que cada linea del titulo cabe en `ancho`. */
export const tamanoTitulo = (titulo: string, ancho: number, maximo: number) => {
  const tamanos = titulo.split('\n').map(
    (linea) =>
      fitText({
        text: linea,
        withinWidth: ancho,
        fontFamily: FUENTE.display,
        fontWeight: '800',
        letterSpacing: TRACKING_DISPLAY,
      }).fontSize,
  );
  return Math.floor(Math.min(maximo, ...tamanos));
};

/** Estimado: el 0.94 compensa que el corte por palabras nunca llena la linea completa. */
export const lineasApoyo = (texto: string, ancho: number, tamano: number) => {
  const {width} = measureText({
    text: texto.replace(/\*/g, ''),
    fontFamily: FUENTE.texto,
    fontWeight: '400',
    fontSize: tamano,
  });
  return Math.max(1, Math.ceil(width / (ancho * 0.94)));
};
