/**
 * Reglas puras del módulo pacientes: filtros, búsqueda, validación del formulario y textos derivados.
 * Sin React ni base de datos, para poder probarlas aisladas.
 */
import { z } from 'zod';

import type { NuevoPaciente } from '@/data/repos/pacientes';
import { AFECTACIONES, type Afectacion, type Paciente, type Tarifa } from '@/domain/types';
import { fechaClave, hoyClave, isoDesde } from '@/lib/dates';

/** Versión del texto de autorización que se registra con cada consentimiento (Anexo C, borrador v0.1). */
export const VERSION_AUTORIZACION = 'v0.1';

export const TARIFAS: { valor: Tarifa; etiqueta: string }[] = [
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'social', etiqueta: 'Social' },
  { valor: 'gratuita', etiqueta: 'Gratuita' },
];

export const etiquetaTarifa = (t: Tarifa) => `Tarifa ${t}`;

export type FiltroLista = 'todos' | 'afectados' | 'archivados';

export const FILTROS: { valor: FiltroLista; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'afectados', etiqueta: 'Afectados' },
  { valor: 'archivados', etiqueta: 'Archivados' },
];

/** Minúsculas, sin tildes ni espacios repetidos: "Patiño" se encuentra escribiendo "patino". */
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export const soloDigitos = (v: string) => v.replace(/\D/g, '');

/** Deja el celular en 10 dígitos; quita el indicativo 57 si viene escrito. */
export function normalizarTelefono(v: string) {
  const d = soloDigitos(v);
  return d.length === 12 && d.startsWith('57') ? d.slice(2) : d;
}

/** Celular colombiano: 10 dígitos que empiezan por 3. */
export const esCelular = (v: string) => /^3\d{9}$/.test(normalizarTelefono(v));

export function coincide(p: Paciente, consulta: string) {
  const q = normalizar(consulta);
  if (!q) return true;
  if (normalizar(p.nombre).includes(q)) return true;
  const digitos = soloDigitos(consulta);
  return digitos.length >= 3 && soloDigitos(p.telefono ?? '').includes(digitos);
}

export function filtrarPacientes(pacientes: Paciente[], filtro: FiltroLista, consulta: string) {
  return pacientes.filter((p) => {
    if (filtro === 'archivados' ? !p.archivadoEn : !!p.archivadoEn) return false;
    if (filtro === 'afectados' && !p.afectadoSismo) return false;
    return coincide(p, consulta);
  });
}

/** Hay alguien (activo o archivado) que se llama exactamente así. */
export const existeNombre = (pacientes: Paciente[], consulta: string) =>
  pacientes.some((p) => normalizar(p.nombre) === normalizar(consulta));

export const etiquetasAfectaciones = (afectaciones: Afectacion[]) =>
  AFECTACIONES.filter((a) => afectaciones.includes(a.valor))
    .map((a) => a.etiqueta)
    .join(', ');

export const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? nombre;

export const saludoWhatsApp = (nombre: string) => `Hola ${primerNombre(nombre)}, ¿cómo estás?`;

/* ---------- Fechas del formulario ---------- */

/** 'yyyy-MM-dd' que existe en el calendario (2026-02-30 no pasa). */
export function esFechaClave(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  return fechaClave(isoDesde(v)) === v;
}

/** Menor de 18 años a la fecha de hoy (Ley 1581: autoriza su representante legal). */
export function esMenorDeEdad(fechaNacimiento: string | null | undefined, hoy = hoyClave()) {
  if (!fechaNacimiento || !esFechaClave(fechaNacimiento)) return false;
  const anio = Number(fechaNacimiento.slice(0, 4));
  return `${anio + 18}${fechaNacimiento.slice(4)}` > hoy;
}

/* ---------- Formulario ---------- */

const VALORES_AFECTACION = AFECTACIONES.map((a) => a.valor) as [Afectacion, ...Afectacion[]];

export function esquemaPaciente(requiereAutorizacion: boolean) {
  return z
    .object({
      nombre: z.string().trim().min(2, 'Escribe el nombre del paciente.'),
      telefono: z
        .string()
        .trim()
        .refine((v) => v === '' || esCelular(v), 'Debe ser un celular de 10 dígitos que empiece por 3.'),
      correo: z
        .string()
        .trim()
        .refine((v) => v === '' || z.email().safeParse(v).success, 'Revisa el correo, por ejemplo nombre@correo.com.'),
      fechaNacimiento: z
        .string()
        .trim()
        .refine((v) => v === '' || esFechaClave(v), 'Usa el formato aaaa-mm-dd, por ejemplo 1990-04-23.')
        .refine((v) => v === '' || !esFechaClave(v) || (v > '1900-01-01' && v <= hoyClave()), 'Esa fecha no es posible.'),
      tarifa: z.enum(['normal', 'social', 'gratuita']),
      afectadoSismo: z.boolean(),
      afectaciones: z.array(z.enum(VALORES_AFECTACION)),
      notasGenerales: z.string(),
      autoriza: z.boolean(),
    })
    .superRefine((d, ctx) => {
      if (d.afectadoSismo && d.afectaciones.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['afectaciones'], message: 'Elige al menos un tipo de afectación.' });
      }
      if (requiereAutorizacion && !d.autoriza) {
        ctx.addIssue({ code: 'custom', path: ['autoriza'], message: 'Sin la autorización no se puede registrar al paciente.' });
      }
    });
}

export type ValoresPaciente = z.infer<ReturnType<typeof esquemaPaciente>>;

export function valoresIniciales(p?: Paciente | null, nombre = ''): ValoresPaciente {
  return {
    nombre: p?.nombre ?? nombre.trim(),
    telefono: p?.telefono ?? '',
    correo: p?.correo ?? '',
    fechaNacimiento: p?.fechaNacimiento ?? '',
    tarifa: p?.tarifa ?? 'normal',
    afectadoSismo: p?.afectadoSismo ?? false,
    afectaciones: p?.afectaciones ?? [],
    notasGenerales: p?.notasGenerales ?? '',
    autoriza: false,
  };
}

/** Valores del formulario → datos del repositorio (vacíos como null, teléfono en 10 dígitos). */
export function aPaciente(v: ValoresPaciente): NuevoPaciente {
  const vacioANull = (s: string) => (s.trim() ? s.trim() : null);
  return {
    nombre: v.nombre.trim().replace(/\s+/g, ' '),
    telefono: v.telefono.trim() ? normalizarTelefono(v.telefono) : null,
    correo: vacioANull(v.correo),
    fechaNacimiento: vacioANull(v.fechaNacimiento),
    tarifa: v.tarifa,
    afectadoSismo: v.afectadoSismo,
    afectaciones: v.afectadoSismo ? v.afectaciones : [],
    notasGenerales: vacioANull(v.notasGenerales),
  };
}
