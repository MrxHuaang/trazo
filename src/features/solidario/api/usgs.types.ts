/** Respuesta GeoJSON del servicio `query` del USGS (solo los campos que usa la app). */
export type USGSFeature = {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    /** Milisegundos desde 1970 (UTC). */
    time: number;
    url?: string;
    title?: string;
  };
  geometry: {
    /** [longitud, latitud, profundidad en km] */
    coordinates: [number, number, number];
  } | null;
};

export type USGSResponse = {
  type: 'FeatureCollection';
  metadata?: { generated: number; count: number };
  features: USGSFeature[];
};
