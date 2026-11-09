/**
 * Datos ficticios de demostración. Nunca usar datos reales de pacientes
 * en desarrollo, pruebas ni sustentación (capítulo 14 del documento maestro).
 */
export type EstadoCita = 'solicitada' | 'confirmada' | 'asistio' | 'no_asistio' | 'cancelada';

export type CitaDemo = {
  id: string;
  /** Minutos desde la medianoche, hora de Colombia. */
  inicioMin: number;
  duracionMin: number;
  paciente: string;
  modalidad: 'presencial' | 'virtual';
  estado: EstadoCita;
  solidaria?: boolean;
};

export const citasHoyDemo: CitaDemo[] = [
  { id: 'c1', inicioMin: 9 * 60, duracionMin: 50, paciente: 'Carlos Restrepo', modalidad: 'virtual', estado: 'asistio' },
  { id: 'c2', inicioMin: 10 * 60, duracionMin: 50, paciente: 'Laura Muñoz', modalidad: 'presencial', estado: 'confirmada' },
  { id: 'c3', inicioMin: 11 * 60, duracionMin: 50, paciente: 'Rosa Patiño', modalidad: 'presencial', estado: 'confirmada', solidaria: true },
  { id: 'c4', inicioMin: 14 * 60 + 30, duracionMin: 50, paciente: 'Jairo Loaiza', modalidad: 'virtual', estado: 'confirmada' },
  { id: 'c5', inicioMin: 16 * 60, duracionMin: 50, paciente: 'Andrés Tobón', modalidad: 'virtual', estado: 'solicitada' },
];

/**
 * Hora de referencia para la demo: la real si cae en horario de consulta;
 * fuera de él, 9:35 a. m., para que "Hoy" siempre muestre una próxima cita.
 */
export function minutosDemo(horaReal: number, minutoReal: number) {
  const real = horaReal * 60 + minutoReal;
  return real >= 7 * 60 && real <= 15 * 60 + 30 ? real : 9 * 60 + 35;
}

export const resumenDemo = {
  porConfirmar: 3,
  cuposSolidarios: { usados: 2, total: 3 },
  porCobrarCOP: 140000,
};
