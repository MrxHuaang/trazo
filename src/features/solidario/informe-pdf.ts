/**
 * Exporta el informe de impacto en PDF (HU-23) con expo-print y lo abre en la hoja de compartir.
 * El documento solo lleva cifras agregadas (ver `htmlInforme`).
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { fechaLarga } from '@/lib/dates';

import { htmlInforme, type CifrasInforme } from './informe';

/** Tamaño carta a 72 ppp, el que usa expo-print por defecto. */
const PAGINA = { width: 612, height: 792 };

/** Devuelve `false` si el dispositivo no puede compartir archivos. */
export async function exportarInformePdf(cifras: CifrasInforme, mes: string, consultorio: string) {
  const html = htmlInforme(cifras, mes, consultorio, fechaLarga(new Date().toISOString()));
  // En web `printToFileAsync` abre el diálogo de impresión y no devuelve archivo.
  const archivo = (await Print.printToFileAsync({ html, ...PAGINA })) as Print.FilePrintResult | undefined;
  if (!archivo?.uri) return true;
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(archivo.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Informe de impacto',
  });
  return true;
}
