/**
 * Informe de impacto del mes (HU-23): cifras agregadas, frases y HTML del PDF.
 * Nunca incluye nombres, motivos de consulta ni notas (RN-10).
 */
import { mesTexto } from '@/lib/dates';
import { color, tile } from '@/theme';

import { capitalizar, plural } from './rules';

export type CifrasInforme = {
  personasAfectadas: number;
  sesionesSolidarias: number;
  sesionesDonadas: number;
  minutosPorSesion: number;
  jornadas: number;
  asistentes: number;
  seguimientosHechos: number;
};

export type Frase = { clave: string; cifra: string; texto: string };

export const horasDonadas = (c: CifrasInforme) => (c.sesionesDonadas * c.minutosPorSesion) / 60;

/** 12,5 · 3 · 0,8 */
export const formatoHoras = (horas: number) => horas.toLocaleString('es-CO', { maximumFractionDigits: 1 });

export const informeVacio = (c: CifrasInforme) =>
  c.personasAfectadas + c.sesionesSolidarias + c.sesionesDonadas + c.asistentes + c.seguimientosHechos === 0;

/** Cifra principal: horas donadas en sesiones sin costo. */
export function fraseHoras(c: CifrasInforme): Frase {
  const horas = horasDonadas(c);
  return {
    clave: 'horas',
    cifra: formatoHoras(horas),
    texto: `${plural(horas, 'hora donada', 'horas donadas')} en ${c.sesionesDonadas} ${plural(
      c.sesionesDonadas,
      'sesión sin costo',
      'sesiones sin costo',
    )} de ${c.minutosPorSesion} minutos.`,
  };
}

export function frasesInforme(c: CifrasInforme): Frase[] {
  const asistentes =
    c.jornadas > 0
      ? `${plural(c.asistentes, 'persona asistió', 'personas asistieron')} a ${c.jornadas} ${plural(
          c.jornadas,
          'jornada comunitaria',
          'jornadas comunitarias',
        )}.`
      : `${plural(c.asistentes, 'persona asistió', 'personas asistieron')} a jornadas comunitarias.`;
  return [
    {
      clave: 'afectadas',
      cifra: String(c.personasAfectadas),
      texto: plural(
        c.personasAfectadas,
        'persona afectada por el sismo recibió atención en consulta.',
        'personas afectadas por el sismo recibieron atención en consulta.',
      ),
    },
    {
      clave: 'solidarias',
      cifra: String(c.sesionesSolidarias),
      texto: plural(
        c.sesionesSolidarias,
        'sesión solidaria atendida, con tarifa social o gratuita.',
        'sesiones solidarias atendidas, con tarifa social o gratuita.',
      ),
    },
    { clave: 'asistentes', cifra: String(c.asistentes), texto: asistentes },
    {
      clave: 'seguimientos',
      cifra: String(c.seguimientosHechos),
      texto: plural(c.seguimientosHechos, 'llamada de seguimiento hecha.', 'llamadas de seguimiento hechas.'),
    },
  ];
}

const escapar = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML del PDF: solo cifras agregadas del mes y el nombre del consultorio que lo emite. */
export function htmlInforme(c: CifrasInforme, mes: string, consultorio: string, generado: string) {
  const horas = fraseHoras(c);
  const filas = frasesInforme(c)
    .map((f) => `<tr><td class="n">${escapar(f.cifra)}</td><td>${escapar(f.texto)}</td></tr>`)
    .join('');
  const raya = `${tile.solidario.fg}26`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  @page { margin: 36px; }
  body { margin: 0; padding: 24px; font-family: -apple-system, 'Helvetica Neue', Roboto, Arial, sans-serif; color: ${color.ink}; background: ${color.surface}; }
  .eyebrow { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${color.inkSoft}; margin: 0 0 6px; }
  h1 { font-size: 30px; line-height: 1.1; margin: 0 0 4px; letter-spacing: -0.5px; }
  .mes { font-size: 16px; color: ${color.inkSoft}; margin: 0 0 24px; }
  .hero { background-color: ${tile.solidario.bg}; color: ${tile.solidario.fg}; border-radius: 18px; padding: 22px 24px;
    background-image: repeating-linear-gradient(45deg, transparent 0, transparent 6px, ${raya} 6px, ${raya} 7.5px); }
  .hero .n { font-size: 44px; font-weight: 800; line-height: 1; letter-spacing: -1px; }
  .hero p { margin: 8px 0 0; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  td { padding: 14px 0; border-bottom: 1px solid ${color.line}; font-size: 15px; vertical-align: baseline; }
  td.n { width: 72px; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .nota { margin-top: 24px; font-size: 11px; line-height: 1.5; color: ${color.inkSoft}; }
</style>
</head>
<body>
  <p class="eyebrow">Programa solidario post-sismo</p>
  <h1>Informe de impacto</h1>
  <p class="mes">${escapar(capitalizar(mesTexto(mes)))} · ${escapar(consultorio)}</p>
  <div class="hero">
    <div class="n">${escapar(horas.cifra)}</div>
    <p>${escapar(horas.texto)}</p>
  </div>
  <table>${filas}</table>
  <p class="nota">
    Cifras agregadas del mes. El informe no incluye nombres, motivos de consulta ni notas de sesión.
    Horas donadas: sesiones sin costo multiplicadas por la duración de la cita.
    Personas atendidas: pacientes afectados por el sismo distintos con al menos una cita a la que asistieron.
    Generado con Trazo el ${escapar(generado)}.
  </p>
</body>
</html>`;
}
