import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { FilePdfIcon } from 'phosphor-react-native/src/icons/FilePdf';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ahoraIso } from '@/data/db';
import { useConsultorio, usePagosMes, usePagosPendientes, useResumenMes } from '@/data/hooks';
import type { PagoConCita } from '@/domain/types';
import { Cabecera } from '@/features/hoy/cabecera';
import { fechaCorta, horaTexto, mesClave, mesTexto } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';
import { color, radius, space, tile } from '@/theme';
import { Button, EmptyState, ListRow, SolidarioMark, Text, Tile } from '@/ui';

import { FilaPendiente } from './fila-pendiente';
import { exportarResumenMes } from './pdf';
import { agruparPorDia, capitalizar, contar, etiquetaMetodo, fraseResumen, nombreMes, sumarMeses } from './rules';

const sesiones = (n: number) => `${n} ${n === 1 ? 'sesión' : 'sesiones'}`;

/**
 * Pagos: arriba lo que falta cobrar (todas las sesiones pendientes, HU-10);
 * debajo el resumen de un mes con selector (HU-16), su exportación en PDF (HU-24) y las sesiones del mes por día.
 */
export function PagosScreen() {
  const insets = useSafeAreaInsets();
  const [mesActual] = useState(() => mesClave());
  const [mes, setMes] = useState(mesActual);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const { data: consultorio } = useConsultorio();
  const tarifa = consultorio?.tarifaBase ?? 0;
  const { data: resumen = { cobrado: 0, pendiente: 0, donado: 0, sesionesDonadas: 0 } } = useResumenMes(mes, tarifa);
  const { data: pagosMes = [] } = usePagosMes(mes);
  const { data: pendientes = [], isPending: cargandoPendientes } = usePagosPendientes();

  const totalPendiente = pendientes.reduce((suma, p) => suma + p.monto, 0);
  const dias = agruparPorDia(pagosMes);
  const nombre = nombreMes(mes, mesActual);

  async function exportar() {
    setExportando(true);
    try {
      await exportarResumenMes({
        mes,
        consultorio: consultorio?.nombre ?? 'Consultorio',
        resumen,
        pagos: pagosMes,
        tarifaReferencia: tarifa,
        generado: ahoraIso(),
      });
    } catch (e) {
      Alert.alert('No se pudo exportar el PDF', e instanceof Error ? e.message : 'Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <Cabecera />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxxl }]}
        showsVerticalScrollIndicator={false}>
        <Text variant="display" accessibilityRole="header">
          Pagos
        </Text>

        <Seccion
          titulo="Por cobrar"
          detalle={pendientes.length > 0 ? `${formatoCOP(totalPendiente)} en ${sesiones(pendientes.length)}` : undefined}>
          {cargandoPendientes ? null : pendientes.length === 0 ? (
            <EmptyState title="Nada por cobrar" body="Todas las sesiones atendidas están pagadas o donadas." />
          ) : (
            pendientes.map((p, i) => (
              <FilaPendiente
                key={p.id}
                pago={p}
                abierta={abierta === p.id}
                onAbrir={() => setAbierta(p.id)}
                onCerrar={() => setAbierta(null)}
                last={i === pendientes.length - 1}
              />
            ))
          )}
        </Seccion>

        <SelectorMes mes={mes} puedeAvanzar={mes < mesActual} onCambiar={setMes} />

        <Text variant="bodyLarge" accessibilityLiveRegion="polite">
          {fraseResumen(resumen, mes, mesActual, pagosMes.length > 0)}
        </Text>

        <Tile tone="pagos">
          <Text variant="label" tone={tile.pagos.fg}>
            Cobrado
          </Text>
          <Text variant="number" tone={tile.pagos.fg} numberOfLines={1} adjustsFontSizeToFit style={styles.number}>
            {formatoCOP(resumen.cobrado)}
          </Text>
          <Text variant="caption" tone={tile.pagos.fg}>
            {sesiones(contar(pagosMes, 'pagado'))} {contar(pagosMes, 'pagado') === 1 ? 'pagada' : 'pagadas'}
          </Text>
        </Tile>
        <View style={styles.pair}>
          <Tile tone="neutral" style={styles.half}>
            <Text variant="label">Pendiente</Text>
            <Text variant="title" numberOfLines={1} adjustsFontSizeToFit>
              {formatoCOP(resumen.pendiente)}
            </Text>
            <Text variant="caption" tone={color.inkSoft}>
              {sesiones(contar(pagosMes, 'pendiente'))}
            </Text>
          </Tile>
          <Tile tone="solidario" style={styles.half}>
            <Text variant="label" tone={tile.solidario.fg}>
              Donado
            </Text>
            <Text variant="title" tone={tile.solidario.fg} numberOfLines={1} adjustsFontSizeToFit>
              {formatoCOP(resumen.donado)}
            </Text>
            <Text variant="caption" tone={tile.solidario.fg}>
              {sesiones(resumen.sesionesDonadas)} {resumen.sesionesDonadas === 1 ? 'donada' : 'donadas'}
            </Text>
          </Tile>
        </View>
        <Text variant="caption" tone={color.inkSoft}>
          El valor donado usa la tarifa base de {formatoCOP(tarifa)} por sesión como referencia.
        </Text>

        <Button
          label={`Exportar ${nombre} en PDF`}
          variant="secondary"
          icon={<FilePdfIcon size={20} color={color.ink} />}
          loading={exportando}
          onPress={() => void exportar()}
          accessibilityHint="Crea un PDF con fechas, montos y estados del mes, con nombres abreviados, y abre el menú para compartirlo"
        />

        {dias.length > 0 ? (
          <Seccion titulo={`Sesiones de ${nombre}`}>
            {dias.map((dia) => (
              <View key={dia.clave} style={styles.dia}>
                <Text variant="label" tone={color.inkSoft} accessibilityRole="header">
                  {capitalizar(fechaCorta(dia.inicio))}
                </Text>
                {dia.pagos.map((p, i) => (
                  <FilaMovimiento key={p.id} pago={p} last={i === dia.pagos.length - 1} />
                ))}
              </View>
            ))}
          </Seccion>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Seccion({ titulo, detalle, children }: { titulo: string; detalle?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="heading" accessibilityRole="header">
          {titulo}
        </Text>
        {detalle ? (
          <Text variant="mono" tone={color.inkSoft}>
            {detalle}
          </Text>
        ) : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

function SelectorMes({ mes, puedeAvanzar, onCambiar }: { mes: string; puedeAvanzar: boolean; onCambiar: (mes: string) => void }) {
  return (
    <View style={styles.selector}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mes anterior, ${mesTexto(sumarMeses(mes, -1))}`}
        onPress={() => onCambiar(sumarMeses(mes, -1))}
        style={({ pressed }) => [styles.flecha, pressed && styles.pressed]}>
        <CaretLeftIcon size={20} color={color.ink} />
      </Pressable>
      <Text variant="heading" accessibilityRole="header" style={styles.mes}>
        {capitalizar(mesTexto(mes))}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mes siguiente, ${mesTexto(sumarMeses(mes, 1))}`}
        accessibilityState={{ disabled: !puedeAvanzar }}
        disabled={!puedeAvanzar}
        onPress={() => onCambiar(sumarMeses(mes, 1))}
        style={({ pressed }) => [styles.flecha, pressed && styles.pressed, !puedeAvanzar && styles.inactiva]}>
        <CaretRightIcon size={20} color={color.ink} />
      </Pressable>
    </View>
  );
}

function FilaMovimiento({ pago: p, last }: { pago: PagoConCita; last: boolean }) {
  const subtitulo =
    p.estado === 'pagado' ? `Pagado · ${etiquetaMetodo(p.metodo)}` : p.estado === 'pendiente' ? 'Pendiente' : 'Sesión donada';
  return (
    <ListRow
      lead={horaTexto(p.citaInicio)}
      title={p.pacienteNombre}
      subtitle={subtitulo}
      badge={p.estado === 'donado' ? <SolidarioMark /> : null}
      last={last}
      trailing={
        p.estado === 'donado' ? null : (
          <Text variant="mono" tone={p.estado === 'pendiente' ? color.inkSoft : color.ink}>
            {formatoCOP(p.monto)}
          </Text>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  content: { paddingHorizontal: space.xl, paddingTop: space.xs, gap: space.md },
  number: { marginVertical: 2 },
  pair: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
  section: { gap: space.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  flecha: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: color.quiet },
  inactiva: { opacity: 0.3 },
  mes: { flex: 1, textAlign: 'center' },
  dia: { marginTop: space.sm },
});
