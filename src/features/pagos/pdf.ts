/**
 * HU-24: resumen del mes en PDF (expo-print) y compartir (expo-sharing).
 * RN-10: el documento solo lleva fechas, montos, estados y nombres abreviados; nunca motivos ni notas.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { ResumenMes } from '@/data/repos/pagos';
import type { PagoConCita } from '@/domain/types';
import { fechaCorta, fechaLarga, horaTexto, mesTexto } from '@/lib/dates';
import { formatoCOP, nombreCorto } from '@/lib/format';
import { color, tile } from '@/theme';

import { capitalizar, contar, ETIQUETA_ESTADO } from './rules';

export type DatosResumenPdf = {
  mes: string;
  consultorio: string;
  resumen: ResumenMes;
  pagos: PagoConCita[];
  tarifaReferencia: number;
  /** ISO del momento en que se genera. */
  generado: string;
};

const ENTIDADES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapar = (texto: string) => texto.replace(/[&<>"']/g, (c) => ENTIDADES[c] ?? c);

const sesiones = (n: number) => `${n} ${n === 1 ? 'sesión' : 'sesiones'}`;

export function htmlResumenMes(d: DatosResumenPdf) {
  const titulo = `Pagos de ${mesTexto(d.mes)}`;
  const filas = [...d.pagos]
    .sort((a, b) => a.citaInicio.localeCompare(b.citaInicio))
    .map(
      (p) => `<tr>
        <td>${escapar(fechaCorta(p.citaInicio))}</td>
        <td>${escapar(nombreCorto(p.pacienteNombre))}</td>
        <td>${ETIQUETA_ESTADO[p.estado]}</td>
        <td class="monto">${formatoCOP(p.monto)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8" />
<title>${escapar(titulo)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Roboto, Arial, sans-serif; color: ${color.ink}; margin: 32px; font-size: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: ${color.inkSoft}; margin: 0 0 20px; }
  .bloques { display: flex; gap: 10px; margin-bottom: 8px; }
  .bloque { flex: 1; border-radius: 12px; padding: 12px 14px; }
  .bloque .etiqueta { font-size: 11px; margin: 0; }
  .bloque .valor { font-size: 18px; font-weight: 700; margin: 2px 0; }
  .bloque .detalle { font-size: 11px; margin: 0; }
  .cobrado { background: ${tile.pagos.bg}; color: ${tile.pagos.fg}; }
  .pendiente { border: 1px solid ${color.line}; }
  .donado { background: ${tile.solidario.bg}; color: ${tile.solidario.fg}; }
  .nota { color: ${color.inkSoft}; font-size: 10px; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; color: ${color.inkSoft}; font-weight: 600; border-bottom: 1px solid ${color.ink}; padding: 6px 4px; }
  td { padding: 6px 4px; border-bottom: 1px solid ${color.line}; }
  .monto { text-align: right; font-variant-numeric: tabular-nums; }
  tr { page-break-inside: avoid; }
  .vacio { color: ${color.inkSoft}; padding: 16px 4px; }
  .pie { color: ${color.inkSoft}; font-size: 10px; margin-top: 20px; }
</style>
</head>
<body>
  <h1>${escapar(titulo)}</h1>
  <p class="meta">${escapar(d.consultorio)} · Generado el ${escapar(fechaLarga(d.generado))} a las ${horaTexto(d.generado)}</p>
  <div class="bloques">
    <div class="bloque cobrado">
      <p class="etiqueta">Cobrado</p>
      <p class="valor">${formatoCOP(d.resumen.cobrado)}</p>
      <p class="detalle">${sesiones(contar(d.pagos, 'pagado'))}</p>
    </div>
    <div class="bloque pendiente">
      <p class="etiqueta">Pendiente</p>
      <p class="valor">${formatoCOP(d.resumen.pendiente)}</p>
      <p class="detalle">${sesiones(contar(d.pagos, 'pendiente'))}</p>
    </div>
    <div class="bloque donado">
      <p class="etiqueta">Donado</p>
      <p class="valor">${formatoCOP(d.resumen.donado)}</p>
      <p class="detalle">${sesiones(d.resumen.sesionesDonadas)} donadas</p>
    </div>
  </div>
  <p class="nota">El valor donado se calcula con la tarifa base de ${formatoCOP(d.tarifaReferencia)} por sesión.</p>
  <table>
    <thead><tr><th>Fecha</th><th>Paciente</th><th>Estado</th><th class="monto">Monto</th></tr></thead>
    <tbody>${filas || '<tr><td class="vacio" colspan="4">Sin sesiones atendidas este mes.</td></tr>'}</tbody>
  </table>
  <p class="pie">Documento de uso interno. Solo incluye fechas, montos y estados; los nombres van abreviados y no hay motivos de consulta ni notas.</p>
</body>
</html>`;
}

/** Genera el PDF y abre el menú de compartir. En la web abre el diálogo de impresión. */
export async function exportarResumenMes(d: DatosResumenPdf) {
  const { uri } = await Print.printToFileAsync({ html: htmlResumenMes(d) });
  if (Platform.OS === 'web') return;
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este dispositivo no permite compartir archivos.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: capitalizar(`pagos de ${mesTexto(d.mes)}`),
  });
}
