import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { FilePdfIcon } from 'phosphor-react-native/src/icons/FilePdf';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { mesClave, mesTexto } from '@/lib/dates';
import { color, space, tile } from '@/theme';
import { Button, EmptyState, Text, Tile } from '@/ui';

import { BotonIcono } from './components/accion';
import { PantallaDetalle } from './components/pantalla-detalle';
import { avisarError } from './dispositivo';
import { useInformeMes } from './hooks';
import { fraseHoras, frasesInforme, informeVacio } from './informe';
import { exportarInformePdf } from './informe-pdf';
import { capitalizar, mesAnterior, mesSiguiente } from './rules';

/** Informe de impacto (HU-23): cifras del mes en frases y exportación a PDF sin nombres. */
export function InformeScreen() {
  const mesActual = mesClave();
  const [mes, setMes] = useState(mesActual);
  const [exportando, setExportando] = useState(false);
  const { cifras, consultorio, error } = useInformeMes(mes);
  const fg = tile.solidario.fg;
  const vacio = cifras ? informeVacio(cifras) : false;

  const exportar = async () => {
    if (!cifras) return;
    setExportando(true);
    try {
      const compartido = await exportarInformePdf(cifras, mes, consultorio?.nombre ?? 'Consultorio');
      if (!compartido) Alert.alert('No se puede compartir aquí', 'Este dispositivo no permite compartir archivos.');
    } catch (e) {
      avisarError('No se pudo crear el PDF')(e);
    } finally {
      setExportando(false);
    }
  };

  return (
    <PantallaDetalle>
      <View style={styles.cabecera}>
        <Text variant="display" accessibilityRole="header">
          Informe de impacto
        </Text>
        <Text variant="body" tone={color.inkSoft}>
          Lo que aportaste desde el programa solidario.
        </Text>
      </View>

      <View style={styles.selector}>
        <BotonIcono icon={CaretLeftIcon} label="Mes anterior" onPress={() => setMes(mesAnterior(mes))} />
        <Text variant="heading" style={styles.mes} accessibilityLiveRegion="polite">
          {capitalizar(mesTexto(mes))}
        </Text>
        <BotonIcono icon={CaretRightIcon} label="Mes siguiente" onPress={() => setMes(mesSiguiente(mes))} disabled={mes >= mesActual} />
      </View>

      {error ? (
        <EmptyState title="No se pudo calcular el informe" body="Cierra esta pantalla y vuelve a abrirla." />
      ) : !cifras ? null : vacio ? (
        <EmptyState
          title="Sin actividad solidaria este mes"
          body="Las cifras aparecen cuando marcas citas como asistidas, registras asistentes en jornadas o completas seguimientos."
        />
      ) : (
        <>
          <Tile tone="solidario" contentStyle={styles.hero}>
            <Text variant="number" tone={fg}>
              {fraseHoras(cifras).cifra}
            </Text>
            <Text variant="bodyMedium" tone={fg}>
              {fraseHoras(cifras).texto}
            </Text>
          </Tile>

          <View>
            {frasesInforme(cifras).map((f, i, arr) => (
              <View
                key={f.clave}
                style={[styles.frase, i < arr.length - 1 && styles.divisor]}
                accessible
                accessibilityLabel={`${f.cifra} ${f.texto}`}>
                <Text variant="title" style={styles.cifra}>
                  {f.cifra}
                </Text>
                <Text variant="bodyLarge" style={styles.texto}>
                  {f.texto}
                </Text>
              </View>
            ))}
          </View>

          <Text variant="caption" tone={color.inkSoft}>
            Cifras agregadas, sin nombres ni motivos de consulta. Las horas donadas son las sesiones sin costo por la duración de
            la cita ({cifras.minutosPorSesion} min).
          </Text>

          <Button
            label="Exportar en PDF"
            icon={<FilePdfIcon size={20} color={color.onAccent} />}
            onPress={() => void exportar()}
            loading={exportando}
            style={styles.exportar}
            accessibilityHint="Crea el informe del mes y abre las opciones para compartirlo"
          />
        </>
      )}
    </PantallaDetalle>
  );
}

const styles = StyleSheet.create({
  cabecera: { gap: space.xs },
  selector: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginVertical: space.sm },
  mes: { flex: 1, textAlign: 'center' },
  hero: { gap: space.xs },
  frase: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.lg },
  divisor: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  cifra: { minWidth: 56 },
  texto: { flex: 1 },
  exportar: { marginTop: space.md },
});
