/**
 * Reglas de los datos del consultorio (HU-26). Las comparten la bienvenida y los ajustes.
 */
import { z } from 'zod';

const MAX_TARIFA = 5_000_000;

/** Deja solo dígitos y los muestra con puntos de miles mientras se escribe: "70000" → "70.000". */
export function pesosEnEdicion(texto: string) {
  const digitos = texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 7);
  return digitos ? Number(digitos).toLocaleString('es-CO') : '';
}

/** "70.000" → 70000. Vacío → NaN (lo rechaza la validación). */
export function pesosDesdeTexto(texto: string) {
  const digitos = texto.replace(/\D/g, '');
  return digitos ? Number(digitos) : Number.NaN;
}

const esCorreo = z.email();

export const campos = {
  nombre: z
    .string()
    .trim()
    .min(3, { error: 'Escribe el nombre del consultorio.' })
    .max(80, { error: 'Usa máximo 80 caracteres.' }),
  profesional: z
    .string()
    .trim()
    .min(3, { error: 'Escribe tu nombre.' })
    .max(80, { error: 'Usa máximo 80 caracteres.' }),
  correo: z
    .string()
    .trim()
    .refine((v) => v === '' || esCorreo.safeParse(v).success, { error: 'Revisa el correo: parece incompleto.' }),
  tarifaBase: z
    .number({ error: 'Escribe la tarifa base.' })
    .int()
    .min(1000, { error: 'La tarifa base debe ser de al menos $1.000.' })
    .max(MAX_TARIFA, { error: 'Revisa la tarifa: parece demasiado alta.' }),
  tarifaSocial: z
    .number({ error: 'Escribe la tarifa social.' })
    .int()
    .min(1000, { error: 'La tarifa social debe ser de al menos $1.000.' })
    .max(MAX_TARIFA, { error: 'Revisa la tarifa: parece demasiado alta.' }),
};

export const esquemaConsultorio = z
  .object(campos)
  .refine((d) => d.tarifaSocial <= d.tarifaBase, {
    path: ['tarifaSocial'],
    error: 'La tarifa social no puede superar la tarifa base.',
  });

export type DatosConsultorio = z.infer<typeof esquemaConsultorio>;
export type CampoConsultorio = keyof typeof campos;
export type ErroresConsultorio = Partial<Record<CampoConsultorio, string>>;

/** Valida y devuelve los datos limpios o el primer error de cada campo. */
export function validarConsultorio(entrada: {
  nombre: string;
  profesional: string;
  correo: string;
  tarifaBase: string;
  tarifaSocial: string;
}): { ok: true; datos: DatosConsultorio } | { ok: false; errores: ErroresConsultorio } {
  const r = esquemaConsultorio.safeParse({
    ...entrada,
    tarifaBase: pesosDesdeTexto(entrada.tarifaBase),
    tarifaSocial: pesosDesdeTexto(entrada.tarifaSocial),
  });
  if (r.success) return { ok: true, datos: r.data };
  const errores: ErroresConsultorio = {};
  for (const issue of r.error.issues) {
    const campo = issue.path[0] as CampoConsultorio | undefined;
    if (campo && !errores[campo]) errores[campo] = issue.message;
  }
  return { ok: false, errores };
}

/** Valida un solo campo (edición en línea de ajustes). Devuelve el mensaje de error o null. */
export function validarCampo<C extends CampoConsultorio>(campo: C, valor: unknown): string | null {
  const r = campos[campo].safeParse(valor);
  return r.success ? null : (r.error.issues[0]?.message ?? 'Revisa este dato.');
}
