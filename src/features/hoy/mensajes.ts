/**
 * Mensajes de WhatsApp a partir de las plantillas del consultorio (HU-06).
 * RN-10: los mensajes nunca incluyen motivos de consulta ni notas.
 */
import type { CitaConPaciente } from '@/domain/types';
import { fechaCorta, horaTexto, isoDesde, sumarDias } from '@/lib/dates';
import { rellenarPlantilla } from '@/lib/whatsapp';

export const VARIABLES = [
  { clave: 'nombre', descripcion: 'primer nombre del paciente' },
  { clave: 'fecha', descripcion: 'fecha corta de la cita' },
  { clave: 'hora', descripcion: 'hora de inicio' },
  { clave: 'modalidad', descripcion: 'presencial o virtual' },
  { clave: 'enlace', descripcion: 'enlace de videollamada, solo en citas virtuales' },
] as const;

const CLAVES: readonly string[] = VARIABLES.map((v) => v.clave);

export const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? nombre;

/** Quita espacios dobles y espacios sobrantes que dejan las variables vacías (p. ej. {enlace} en presencial). */
export const limpiarMensaje = (texto: string) =>
  texto
    .split('\n')
    .map((linea) => linea.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();

type DatosCita = Pick<CitaConPaciente, 'inicio' | 'modalidad' | 'enlace'> & { paciente: { nombre: string } };

export function valoresCita(cita: DatosCita) {
  return {
    nombre: primerNombre(cita.paciente.nombre),
    fecha: fechaCorta(cita.inicio),
    hora: horaTexto(cita.inicio),
    modalidad: cita.modalidad,
    enlace: cita.modalidad === 'virtual' ? (cita.enlace ?? '') : '',
  };
}

export const mensajeDesdePlantilla = (plantilla: string, valores: Record<string, string>) =>
  limpiarMensaje(rellenarPlantilla(plantilla, valores));

export const mensajeRecordatorio = (plantilla: string, cita: DatosCita) => mensajeDesdePlantilla(plantilla, valoresCita(cita));

/** RN-06: mensaje para retomar el contacto tras dos inasistencias (sin mencionar las inasistencias). */
export const mensajeContacto = (nombre: string) =>
  `Hola ${primerNombre(nombre)}, ¿cómo vas? Quería saber cómo estás y si quieres que agendemos una nueva cita.`;

/** Variables escritas en la plantilla que no existen (p. ej. {nombres}). */
export function variablesDesconocidas(plantilla: string) {
  const encontradas = [...plantilla.matchAll(/\{([^{}\s]*)\}/g)].map((m) => m[1] ?? '');
  return [...new Set(encontradas.filter((clave) => !CLAVES.includes(clave)))];
}

/** Datos ficticios para la vista previa: una cita virtual mañana a las 10:00. */
export function valoresEjemplo(hoy: string) {
  const inicio = isoDesde(sumarDias(hoy, 1), '10:00');
  return valoresCita({
    inicio,
    modalidad: 'virtual',
    enlace: 'https://meet.google.com/abc-defg-hij',
    paciente: { nombre: 'Laura Muñoz' },
  });
}
