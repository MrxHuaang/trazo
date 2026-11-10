/**
 * Fechas en la zona de Colombia (RN-02): se guardan en ISO UTC y se muestran en America/Bogota.
 * "fechaClave" = 'yyyy-MM-dd' en hora de Colombia; "mesClave" = 'yyyy-MM'.
 */
import { TZDate } from '@date-fns/tz';
import { addDays, addMinutes, differenceInCalendarDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale/es';

export const ZONA = 'America/Bogota';

export const ahora = () => new TZDate(Date.now(), ZONA);

export const enZona = (valor: string | Date | number) =>
  new TZDate(typeof valor === 'string' ? new Date(valor).getTime() : new Date(valor).getTime(), ZONA);

/** ISO UTC a partir de fecha 'yyyy-MM-dd' y hora 'HH:mm' de Colombia. */
export function isoDesde(fechaClave: string, hora = '00:00') {
  const [y, m, d] = fechaClave.split('-').map(Number);
  const [h, mi] = hora.split(':').map(Number);
  return new TZDate(y ?? 1970, (m ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, ZONA).toISOString();
}

/** Acepta una clave 'yyyy-MM-dd' o un ISO completo y devuelve la fecha en la zona de Colombia. */
const deClave = (valor: string) => enZona(valor.length === 10 ? isoDesde(valor) : valor);

export const fechaClave = (valor: string | Date = new Date()) => format(enZona(valor), 'yyyy-MM-dd');
export const mesClave = (valor: string | Date = new Date()) => format(enZona(valor), 'yyyy-MM');
export const hoyClave = () => fechaClave(new Date());

export const sumarDias = (clave: string, dias: number) => fechaClave(addDays(deClave(clave), dias));
export const sumarMinutos = (iso: string, minutos: number) => addMinutes(new Date(iso), minutos).toISOString();

/** Lunes de la semana de la fecha dada (RN-03: semanas de lunes a domingo). */
export const inicioSemana = (clave: string) =>
  fechaClave(startOfWeek(deClave(clave), { weekStartsOn: 1 }));

export const diasEntre = (desde: string, hasta: string) =>
  differenceInCalendarDays(deClave(hasta), deClave(desde));

/** Minutos desde la medianoche en Colombia. */
export function minutosDelDia(iso: string) {
  const d = enZona(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export const horaTexto = (iso: string) => format(enZona(iso), 'HH:mm');
export const fechaCorta = (iso: string) => format(enZona(iso), 'EEE d MMM', { locale: es });
export const fechaLarga = (iso: string) => format(enZona(iso), "EEEE d 'de' MMMM", { locale: es });
export const mesTexto = (clave: string) => format(enZona(isoDesde(`${clave}-01`)), "MMMM 'de' yyyy", { locale: es });
export const diaSemanaCorto = (clave: string) => format(deClave(clave), 'EEEEE', { locale: es });
export const numeroDia = (clave: string) => format(deClave(clave), 'd');

/** 1 = lunes … 7 = domingo. */
export const diaSemana = (clave: string) => {
  const d = deClave(clave).getDay();
  return d === 0 ? 7 : d;
};

/** "en 25 min", "en 2 h", "ahora", "hace 1 h". */
export function tiempoRelativo(iso: string, referencia = new Date()) {
  const diff = Math.round((new Date(iso).getTime() - referencia.getTime()) / 60000);
  if (Math.abs(diff) < 1) return 'ahora';
  const abs = Math.abs(diff);
  const texto = abs < 60 ? `${abs} min` : abs % 60 === 0 ? `${Math.floor(abs / 60)} h` : `${Math.floor(abs / 60)} h ${abs % 60} min`;
  return diff > 0 ? `en ${texto}` : `hace ${texto}`;
}
