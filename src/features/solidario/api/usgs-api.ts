import { create } from 'axios';

// Catálogo público del USGS, sin llave. Solo se mandan parámetros fijos, nunca datos de pacientes.
export const usgsApi = create({
  baseURL: 'https://earthquake.usgs.gov/fdsnws/event/1',
  timeout: 12_000,
  headers: { Accept: 'application/json' },
});
