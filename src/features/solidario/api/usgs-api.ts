import { create } from 'axios';

/**
 * Catálogo público de sismos del USGS (sin llave). Solo se consulta: la petición lleva
 * parámetros fijos (zona de Pereira) y nunca datos de la app ni de pacientes.
 */
export const usgsApi = create({
  baseURL: 'https://earthquake.usgs.gov/fdsnws/event/1',
  timeout: 12_000,
  headers: { Accept: 'application/json' },
});
