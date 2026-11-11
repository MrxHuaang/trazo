import { mapUSGSFeature, PEREIRA, type Sismo } from './sismo.mapper';
import { usgsApi } from './usgs-api';
import type { USGSResponse } from './usgs.types';

/** Zona y umbral de la consulta: 400 km alrededor de Pereira, magnitud 2,5 o más, los 10 más recientes. */
export const CONSULTA_SISMOS = { radioKm: 400, magnitudMinima: 2.5, limite: 10 } as const;

/** Sismos recientes cerca de Pereira, del más reciente al más antiguo. */
export const getSismosRecientes = async (): Promise<Sismo[]> => {
  const { data } = await usgsApi.get<USGSResponse>('/query', {
    params: {
      format: 'geojson',
      latitude: PEREIRA.latitud,
      longitude: PEREIRA.longitud,
      maxradiuskm: CONSULTA_SISMOS.radioKm,
      minmagnitude: CONSULTA_SISMOS.magnitudMinima,
      orderby: 'time',
      limit: CONSULTA_SISMOS.limite,
    },
  });
  return data.features.map(mapUSGSFeature).filter((s): s is Sismo => s !== null);
};
