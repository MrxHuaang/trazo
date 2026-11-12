/**
 * Llaves base de TanStack Query por entidad. Toda consulta empieza con una de estas,
 * así una mutación invalida por entidad sin conocer las consultas de otros módulos.
 */
export const qk = {
  consultorio: ['consultorio'] as const,
  pacientes: ['pacientes'] as const,
  citas: ['citas'] as const,
  pagos: ['pagos'] as const,
  seguimientos: ['seguimientos'] as const,
  notas: ['notas'] as const,
  consentimientos: ['consentimientos'] as const,
  disponibilidad: ['disponibilidad'] as const,
  bloqueos: ['bloqueos'] as const,
  jornadas: ['jornadas'] as const,
  asistentes: ['asistentes'] as const,
  recursos: ['recursos'] as const,
};
