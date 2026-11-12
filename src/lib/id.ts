import { randomUUID } from 'expo-crypto';

/** UUID generado en el teléfono (permite crear registros antes de cualquier sincronización). */
export const nuevoId = () => randomUUID();
