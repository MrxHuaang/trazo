import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { FilePdfIcon } from 'phosphor-react-native/src/icons/FilePdf';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { mesClave, mesTexto } from '@/lib/dates';
import { color } from '@/theme';
import { Aparecer, Button, EmptyState, NumeroAnimado, Text, Tile } from '@/ui';

import { BotonIcono } from './components/accion';
import { PantallaDetalle } from './components/pantalla-detalle';
import { avisarError } from './dispositivo';
import { useInformeMes } from './hooks';
import { formatoHoras, fraseHoras, frasesInforme, informeVacio } from './informe';
import { exportarInformePdf } from './informe-pdf';
import { capitalizar, mesAnterior, mesSiguiente } from './rules';

/** Informe de impacto (HU-23): cifras del mes que cuentan al cambiar de mes y exportación a PDF sin nombres. */
export function InformeScreen() {
  const mesActual = mesClave();
  const [mes, setMes] = useState(mesActual);
  const [exportando, setExportando] = useState(false);
  const { cifras, consultorio, error } = useInformeMes(mes);
  const vacio = cifras ? informeVacio(cifras) : false;
  const horas = cifras ? fraseHoras(cifras) : null;

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
      <Aparecer orden={0}>
        <Text variant="display" accessibilityRole="header">
          Informe de impacto
        </Text>
      </Aparecer>

      <Aparecer orden={1} className="flex-row items-center gap-3">
        <BotonIcono icon={CaretLeftIcon} label="Ver el mes anterior" onPress={() => setMes(mesAnterior(mes))} />
        <Text variant="heading" className="flex-1 text-center" accessibilityLiveRegion="polite">
          {capitalizar(mesTexto(mes))}
        </Text>
        <BotonIcono icon={CaretRightIcon} label="Ver el mes siguiente" onPress={() => setMes(mesSiguiente(mes))} disabled={mes >= mesActual} />
      </Aparecer>

      {error ? (
        <EmptyState title="No se pudo calcular el informe" body="Cierra esta pantalla y vuelve a abrirla." />
      ) : !cifras || !horas ? null : vacio ? (
        <EmptyState title="Sin actividad solidaria este mes" body="Aquí aparecen tus citas, jornadas y seguimientos del mes." />
      ) : (
        <>
          <Aparecer orden={2}>
            <Tile tone="solidario" contentClassName="gap-1">
              <NumeroAnimado valor={horas.valor} formato={formatoHoras} variant="display" className="text-durazno-ink" />
              <Text variant="bodyMedium" className="text-durazno-ink">
                {horas.texto}
              </Text>
            </Tile>
          </Aparecer>

          <Aparecer orden={3} className="gap-5 py-2">
            {frasesInforme(cifras).map((f) => (
              <View key={f.clave} className="flex-row items-center gap-4" accessible accessibilityLabel={`${f.cifra} ${f.texto}`}>
                <NumeroAnimado valor={f.valor} variant="title" className="min-w-[56px]" />
                <Text variant="bodyLarge" className="flex-1">
                  {f.texto}
                </Text>
              </View>
            ))}
          </Aparecer>

          <Aparecer orden={4} className="gap-3">
            <Text variant="caption" className="text-ink-soft">
              Sin nombres ni motivos de consulta.
            </Text>
            <Button
              label="Exportar en PDF"
              icon={<FilePdfIcon size={20} color={color.onAccent} />}
              onPress={() => void exportar()}
              loading={exportando}
              accessibilityHint="Crea el informe del mes y abre las opciones para compartirlo"
            />
          </Aparecer>
        </>
      )}
    </PantallaDetalle>
  );
}
