import { randomUUID } from 'expo-crypto';

// UUID local y no autoincremental, para que los registros no choquen el día que se sincronice (ADR-010).
export const nuevoId = () => randomUUID();
