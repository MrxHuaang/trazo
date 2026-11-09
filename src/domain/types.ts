/**
 * Entidades del dominio (capítulo 9 del documento maestro). Fechas en ISO UTC (RN-02);
 * `*Clave` = 'yyyy-MM-dd' en hora de Colombia.
 */

export type Tarifa = 'normal' | 'social' | 'gratuita';
export type EstadoCita = 'solicitada' | 'confirmada' | 'asistio' | 'no_asistio' | 'cancelada';
export type Modalidad = 'presencial' | 'virtual';
export type MetodoPago = 'efectivo' | 'nequi' | 'daviplata' | 'transferencia' | 'otro';
export type EstadoPago = 'pendiente' | 'pagado' | 'donado';
export type EstadoSeguimiento = 'pendiente' | 'hecho' | 'descartado';
export type Afectacion = 'vivienda' | 'familiar' | 'negocio' | 'empleo' | 'salud' | 'otra';

export const AFECTACIONES: { valor: Afectacion; etiqueta: string }[] = [
  { valor: 'vivienda', etiqueta: 'Vivienda' },
  { valor: 'familiar', etiqueta: 'Pérdida familiar' },
  { valor: 'negocio', etiqueta: 'Negocio' },
  { valor: 'empleo', etiqueta: 'Empleo' },
  { valor: 'salud', etiqueta: 'Salud' },
  { valor: 'otra', etiqueta: 'Otra' },
];

export const ESTADOS_CITA: { valor: EstadoCita; etiqueta: string }[] = [
  { valor: 'solicitada', etiqueta: 'Solicitada' },
  { valor: 'confirmada', etiqueta: 'Confirmada' },
  { valor: 'asistio', etiqueta: 'Asistió' },
  { valor: 'no_asistio', etiqueta: 'No asistió' },
  { valor: 'cancelada', etiqueta: 'Cancelada' },
];

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: 'nequi', etiqueta: 'Nequi' },
  { valor: 'daviplata', etiqueta: 'Daviplata' },
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export type Consultorio = {
  id: string;
  nombre: string;
  profesional: string;
  correo: string | null;
  tarifaBase: number;
  tarifaSocial: number;
  duracionCita: number;
  cuposSolidariosSemana: number;
  plantillaRecordatorio: string;
  plantillaConfirmacion: string;
  bloqueoActivo: boolean;
  creadoEn: string;
};

export type Paciente = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  fechaNacimiento: string | null;
  tarifa: Tarifa;
  afectadoSismo: boolean;
  afectaciones: Afectacion[];
  notasGenerales: string | null;
  archivadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type Cita = {
  id: string;
  pacienteId: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  modalidad: Modalidad;
  enlace: string | null;
  motivo: string | null;
  esSolidaria: boolean;
  origen: 'app' | 'web';
  recordadaEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

/** Cita con los datos del paciente que casi todas las vistas necesitan. */
export type CitaConPaciente = Cita & {
  paciente: Pick<Paciente, 'id' | 'nombre' | 'telefono' | 'tarifa' | 'afectadoSismo'>;
};

export type Pago = {
  id: string;
  citaId: string;
  pacienteId: string;
  monto: number;
  metodo: MetodoPago | null;
  estado: EstadoPago;
  pagadoEn: string | null;
  creadoEn: string;
};

export type PagoConCita = Pago & { citaInicio: string; pacienteNombre: string };

export type NotaSesion = {
  id: string;
  pacienteId: string;
  citaId: string | null;
  contenido: string;
  creadoEn: string;
  actualizadoEn: string;
};

export type Consentimiento = {
  id: string;
  pacienteId: string;
  tipo: 'datos_personales' | 'atencion';
  versionTexto: string;
  aceptadoEn: string;
  revocadoEn: string | null;
};

export type Disponibilidad = {
  id: string;
  /** 1 = lunes … 7 = domingo */
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modalidad: Modalidad;
};

export type Bloqueo = { id: string; inicio: string; fin: string; motivo: string | null };

export type Jornada = {
  id: string;
  titulo: string;
  tipo: 'taller' | 'charla' | 'atencion_grupal';
  lugar: string;
  barrio: string | null;
  inicio: string;
  fin: string;
  cupos: number;
  descripcion: string | null;
  creadoEn: string;
};

export type Asistente = {
  id: string;
  jornadaId: string;
  pacienteId: string | null;
  nombre: string;
  telefono: string | null;
  requiereSeguimiento: boolean;
  consentimientoDatos: boolean;
  creadoEn: string;
};

export type Seguimiento = {
  id: string;
  pacienteId: string | null;
  asistenteId: string | null;
  nombre: string;
  telefono: string | null;
  fechaObjetivo: string;
  motivo: string;
  estado: EstadoSeguimiento;
  nota: string | null;
  creadoEn: string;
};

export type Recurso = {
  id: string;
  titulo: string;
  descripcion: string | null;
  telefono: string | null;
  whatsapp: string | null;
  url: string | null;
  orden: number;
};

export class ErrorSolape extends Error {
  constructor() {
    super('Ese horario se cruza con otra cita.');
    this.name = 'ErrorSolape';
  }
}
