/**
 * Resumen del paciente en PDF (HU-24, HU-25): datos básicos, autorizaciones, citas y pagos.
 * Nunca incluye notas de sesión ni notas generales (pueden tener información clínica).
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  AFECTACIONES,
  ESTADOS_CITA,
  METODOS_PAGO,
  type CitaConPaciente,
  type Consentimiento,
  type Consultorio,
  type Paciente,
  type PagoConCita,
} from '@/domain/types';
import { fechaClave, fechaCorta, fechaLarga, horaTexto } from '@/lib/dates';
import { formatoCOP, formatoTelefono } from '@/lib/format';
import { color, tile } from '@/theme';

import { etiquetaTarifa } from './rules';

export type DatosResumen = {
  paciente: Paciente;
  citas: CitaConPaciente[];
  pagos: PagoConCita[];
  consentimientos: Consentimiento[];
  consultorio: Consultorio | null;
  generado?: Date;
};

const esc = (v: string | number | null | undefined) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Fecha corta con año: "lun 9 nov 2026". */
const fechaConAnio = (iso: string) => `${fechaCorta(iso)} ${fechaClave(iso).slice(0, 4)}`;

/** El Trazo de la marca en SVG: agitado al inicio, en calma al final. */
function trazoSvg(ancho = 160, alto = 18) {
  const mid = alto / 2;
  let puntos = '';
  for (let x = 0; x <= ancho; x += 2) {
    const t = Math.min(x / (ancho * 0.4), 1);
    const y = mid + (mid - 2) * Math.pow(1 - t, 1.6) * (Math.sin(x * 0.16 + 1.2) * 0.8 + Math.sin(x * 0.41 + 1.3) * 0.2);
    puntos += `${x},${y.toFixed(2)} `;
  }
  return `<svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><polyline points="${puntos}" fill="none" stroke="${color.ink}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

const fila = (etiqueta: string, valor: string) => `<tr><th>${esc(etiqueta)}</th><td>${esc(valor)}</td></tr>`;

export function htmlResumen({ paciente: p, citas, pagos, consentimientos, consultorio, generado = new Date() }: DatosResumen) {
  const afectaciones = AFECTACIONES.filter((a) => p.afectaciones.includes(a.valor)).map((a) => a.etiqueta).join(', ');
  const estadoCita = (e: CitaConPaciente['estado']) => ESTADOS_CITA.find((x) => x.valor === e)?.etiqueta ?? e;
  const metodo = (m: PagoConCita['metodo']) => METODOS_PAGO.find((x) => x.valor === m)?.etiqueta ?? '';
  const estadoPago = { pendiente: 'Pendiente', pagado: 'Pagado', donado: 'Donado' } as const;

  const citasOrden = [...citas].sort((a, b) => b.inicio.localeCompare(a.inicio));
  const conteo = (e: CitaConPaciente['estado']) => citas.filter((c) => c.estado === e).length;
  const pagado = pagos.filter((x) => x.estado === 'pagado').reduce((s, x) => s + x.monto, 0);
  const pendiente = pagos.filter((x) => x.estado === 'pendiente').reduce((s, x) => s + x.monto, 0);
  const donadas = pagos.filter((x) => x.estado === 'donado').length;

  const datos = [
    fila('Nombre', p.nombre),
    fila('Celular', p.telefono ? formatoTelefono(p.telefono) : 'Sin registrar'),
    fila('Correo', p.correo ?? 'Sin registrar'),
    fila('Fecha de nacimiento', p.fechaNacimiento ?? 'Sin registrar'),
    fila('Tarifa', etiquetaTarifa(p.tarifa)),
    fila('Afectado por el sismo', p.afectadoSismo ? `Sí${afectaciones ? ` · ${afectaciones}` : ''}` : 'No'),
    fila('Estado', p.archivadoEn ? `Archivado desde el ${fechaConAnio(p.archivadoEn)}` : 'Activo'),
    fila('Registrado el', fechaConAnio(p.creadoEn)),
  ].join('');

  const autorizaciones = consentimientos.length
    ? consentimientos
        .map((c) => {
          const nombre = c.tipo === 'datos_personales' ? 'Tratamiento de datos personales (Ley 1581 de 2012)' : 'Consentimiento informado';
          const revocada = c.revocadoEn ? ` · revocada el ${fechaConAnio(c.revocadoEn)}` : '';
          return `<li>${esc(nombre)}: aceptada el ${esc(fechaConAnio(c.aceptadoEn))}, texto ${esc(c.versionTexto)}${esc(revocada)}</li>`;
        })
        .join('')
    : '<li>Sin autorizaciones registradas.</li>';

  const filasCitas = citasOrden.length
    ? citasOrden
        .map(
          (c) =>
            `<tr><td>${esc(fechaConAnio(c.inicio))}</td><td class="mono">${esc(horaTexto(c.inicio))}</td><td>${esc(
              c.modalidad === 'virtual' ? 'Virtual' : 'Presencial',
            )}</td><td>${esc(estadoCita(c.estado))}</td><td>${c.esSolidaria ? 'Solidaria' : ''}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="5" class="vacio">Sin citas registradas.</td></tr>';

  const filasPagos = pagos.length
    ? pagos
        .map(
          (x) =>
            `<tr><td>${esc(fechaConAnio(x.citaInicio))}</td><td class="mono">${esc(formatoCOP(x.monto))}</td><td>${esc(
              estadoPago[x.estado],
            )}</td><td>${esc(metodo(x.metodo))}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="4" class="vacio">Sin pagos registrados.</td></tr>';

  const anio = fechaClave(generado).slice(0, 4);

  return `<!doctype html>
<html lang="es-CO"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  @page { margin: 36px; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Roboto, Arial, sans-serif; color: ${color.ink}; font-size: 11px; line-height: 1.45; margin: 0; }
  header { background: ${tile.consulta.bg}; color: ${tile.consulta.fg}; border-radius: 14px; padding: 16px 18px; margin-bottom: 18px; }
  header .consultorio { font-size: 11px; margin: 0 0 6px; }
  header h1 { font-size: 22px; line-height: 1.1; margin: 4px 0 6px; letter-spacing: -0.4px; }
  header .meta { font-size: 10px; margin: 0; }
  h2 { font-size: 13px; margin: 18px 0 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid ${color.line}; vertical-align: top; }
  thead th { color: ${color.inkSoft}; font-weight: 600; font-size: 10px; }
  .datos th { width: 32%; color: ${color.inkSoft}; font-weight: 500; }
  .mono { font-family: Menlo, 'Roboto Mono', monospace; }
  .vacio { color: ${color.inkSoft}; }
  ul { margin: 0; padding-left: 16px; }
  .totales { display: flex; gap: 18px; margin-top: 8px; }
  .totales div { flex: 1; border: 1px solid ${color.line}; border-radius: 10px; padding: 8px 10px; }
  .totales b { display: block; font-size: 14px; }
  .resumen { color: ${color.inkSoft}; margin: 0 0 6px; }
  footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid ${color.line}; color: ${color.inkSoft}; font-size: 9.5px; }
  tr { page-break-inside: avoid; }
</style></head>
<body>
  <header>
    <p class="consultorio">${esc(consultorio?.nombre ?? 'Consultorio')}${consultorio ? ` · ${esc(consultorio.profesional)}` : ''}</p>
    ${trazoSvg()}
    <h1>${esc(p.nombre)}</h1>
    <p class="meta">Resumen del paciente · generado el ${esc(fechaLarga(generado.toISOString()))} de ${anio}, ${esc(
      horaTexto(generado.toISOString()),
    )}</p>
  </header>

  <h2>Datos básicos</h2>
  <table class="datos">${datos}</table>

  <h2>Autorizaciones</h2>
  <ul>${autorizaciones}</ul>

  <h2>Citas</h2>
  <p class="resumen">${citas.length} en total · ${conteo('asistio')} asistió · ${conteo('no_asistio')} no asistió · ${conteo(
    'cancelada',
  )} canceladas</p>
  <table>
    <thead><tr><th>Fecha</th><th>Hora</th><th>Modalidad</th><th>Estado</th><th>Tipo</th></tr></thead>
    <tbody>${filasCitas}</tbody>
  </table>

  <h2>Pagos</h2>
  <table>
    <thead><tr><th>Cita</th><th>Monto</th><th>Estado</th><th>Método</th></tr></thead>
    <tbody>${filasPagos}</tbody>
  </table>
  <div class="totales">
    <div>Pagado<b class="mono">${esc(formatoCOP(pagado))}</b></div>
    <div>Pendiente<b class="mono">${esc(formatoCOP(pendiente))}</b></div>
    <div>Sesiones donadas<b class="mono">${donadas}</b></div>
  </div>

  <footer>
    Este resumen no incluye notas de sesión ni notas clínicas. Contiene datos personales sensibles (Ley 1581 de 2012):
    compártelo solo con el titular o con quien él autorice.
  </footer>
</body></html>`;
}

/** Genera el PDF y abre el menú de compartir del teléfono. */
export async function exportarResumenPdf(datos: DatosResumen) {
  const { uri } = await Print.printToFileAsync({
    html: htmlResumen(datos),
    margins: { top: 36, right: 36, bottom: 36, left: 36 },
  });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este dispositivo no permite compartir archivos.');
  }
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Compartir resumen en PDF' });
}
