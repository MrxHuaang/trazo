// Solo los campos del GeoJSON del USGS que usa la app.
export type USGSFeature = {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    /** Epoch en ms (UTC). */
    time: number;
    url?: string;
    title?: string;
  };
  geometry: {
    /** GeoJSON pone la longitud primero: [lng, lat, profundidad km]. */
    coordinates: [number, number, number];
  } | null;
};

export type USGSResponse = {
  type: 'FeatureCollection';
  metadata?: { generated: number; count: number };
  features: USGSFeature[];
};
