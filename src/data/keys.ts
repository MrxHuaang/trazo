// Toda query key empieza con una de estas. Así una mutación invalida la entidad completa
// sin tener que conocer las consultas que arma cada feature.
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
