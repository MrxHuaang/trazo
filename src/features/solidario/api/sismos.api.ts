import { mapUSGSFeature, PEREIRA, type Sismo } from './sismo.mapper';
import { usgsApi } from './usgs-api';
import type { USGSResponse } from './usgs.types';

// 400 km alrededor de Pereira y magnitud 2,5 o más.
export const CONSULTA_SISMOS = { radioKm: 400, magnitudMinima: 2.5, limite: 10 } as const;

/** Del más reciente al más antiguo (orderby=time). */
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
