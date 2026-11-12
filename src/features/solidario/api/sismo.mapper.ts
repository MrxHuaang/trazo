import type { USGSFeature } from './usgs.types';

/** Centro de referencia: Pereira, Risaralda. */
export const PEREIRA = { latitud: 4.8133, longitud: -75.6961 } as const;

/** Sismo en el modelo de la app. */
export type Sismo = {
  id: string;
  magnitud: number;
  /** Lugar en español, p. ej. "12 km al SO de Pereira, Colombia". */
  lugar: string;
  /** Momento del sismo en milisegundos (UTC). */
  momento: number;
  latitud: number;
  longitud: number;
  profundidadKm: number;
  /** Distancia en línea recta a Pereira. */
  distanciaKm: number;
};

/** Distancia en km entre dos puntos (fórmula del haversine). */
export function distanciaKm(a: { latitud: number; longitud: number }, b: { latitud: number; longitud: number }) {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "12 km SSW of Pereira, Colombia" → "12 km al SSO de Pereira, Colombia". */
export function lugarEnEspanol(place: string | null) {
  if (!place) return 'Lugar sin precisar';
  const partes = /^(\d+(?:\.\d+)?) km ([NSEW]{1,3}) of (.+)$/.exec(place.trim());
  if (!partes) return place.trim();
  const [, km, rumbo, sitio] = partes;
  return `${Math.round(Number(km))} km al ${rumbo!.replace(/W/g, 'O')} de ${sitio}`;
}

/** Convierte un evento del USGS; devuelve null si no trae magnitud o coordenadas. */
export function mapUSGSFeature(f: USGSFeature): Sismo | null {
  const coords = f.geometry?.coordinates;
  if (f.properties.mag == null || !coords) return null;
  const [longitud, latitud, profundidad] = coords;
  return {
    id: f.id,
    magnitud: Math.round(f.properties.mag * 10) / 10,
    lugar: lugarEnEspanol(f.properties.place),
    momento: f.properties.time,
    latitud,
    longitud,
    profundidadKm: Math.round(profundidad ?? 0),
    distanciaKm: Math.round(distanciaKm(PEREIRA, { latitud, longitud })),
  };
}
