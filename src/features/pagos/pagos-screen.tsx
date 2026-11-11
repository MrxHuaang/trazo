import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { FilePdfIcon } from 'phosphor-react-native/src/icons/FilePdf';
import { useState, type ReactNode } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ahoraIso } from '@/data/db';
import { useConsultorio, usePagosMes, usePagosPendientes, useResumenMes } from '@/data/hooks';
import type { PagoConCita } from '@/domain/types';
import { BotonIcono } from '@/features/hoy/boton-icono';
import { Cabecera } from '@/features/hoy/cabecera';
import { FilaAnimada } from '@/features/hoy/filas';
import { fechaCorta, horaTexto, mesClave, mesTexto } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';
import { color } from '@/theme';
import { Aparecer, Button, EmptyState, ListRow, NumeroAnimado, SolidarioMark, Text, Tile } from '@/ui';

import { FilaPendiente } from './fila-pendiente';
import { exportarResumenMes } from './pdf';
import { agruparPorDia, capitalizar, contar, etiquetaMetodo, fraseResumen, nombreMes, sumarMeses } from './rules';
import { usePagosStore } from './store';

const sesiones = (n: number) => `${n} ${n === 1 ? 'sesión' : 'sesiones'}`;

/**
 * Pagos: arriba lo que falta cobrar (todas las sesiones pendientes, HU-10);
 * debajo el resumen de un mes con selector (HU-16), su exportación en PDF (HU-24) y las sesiones del mes por día.
 * Al registrar un pago, la fila sale de "Por cobrar", aparece como pagada en el mes y los totales cuentan.
 */
export function PagosScreen() {
  const insets = useSafeAreaInsets();
  const [mesActual] = useState(() => mesClave());
  const mes = usePagosStore((s) => s.mes);
  const elegirMes = usePagosStore((s) => s.elegirMes);
  const [exportando, setExportando] = useState(false);

  const { data: consultorio } = useConsultorio();
  const tarifa = consultorio?.tarifaBase ?? 0;
  const { data: resumen = { cobrado: 0, pendiente: 0, donado: 0, sesionesDonadas: 0 } } = useResumenMes(mes, tarifa);
  const { data: pagosMes = [] } = usePagosMes(mes);
  const { data: pendientes = [], isPending: cargandoPendientes } = usePagosPendientes();

  const totalPendiente = pendientes.reduce((suma, p) => suma + p.monto, 0);
  const dias = agruparPorDia(pagosMes);
  const nombre = nombreMes(mes, mesActual);
  const pagadas = contar(pagosMes, 'pagado');

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
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <Cabecera />
      <ScrollView
        contentContainerClassName="gap-3 px-5 pt-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}>
        <Aparecer orden={0}>
          <Text variant="display" accessibilityRole="header">
            Pagos
          </Text>
        </Aparecer>

        <Aparecer orden={1} reacomodar>
          <Seccion
            titulo="Por cobrar"
            detalle={
              pendientes.length > 0 ? (
                <View className="flex-row items-baseline">
                  <NumeroAnimado valor={totalPendiente} formato={formatoCOP} variant="mono" className="text-ink-soft" />
                  <Text variant="mono" className="text-ink-soft">
                    {` en ${sesiones(pendientes.length)}`}
                  </Text>
                </View>
              ) : null
            }>
            {cargandoPendientes ? null : pendientes.length === 0 ? (
              <EmptyState title="Nada por cobrar" body="Todas las sesiones atendidas están pagadas o donadas." />
            ) : (
              pendientes.map((p, i) => <FilaPendiente key={p.id} pago={p} last={i === pendientes.length - 1} />)
            )}
          </Seccion>
        </Aparecer>

        <Aparecer orden={2} reacomodar className="mt-4 gap-3">
          <SelectorMes mes={mes} puedeAvanzar={mes < mesActual} onCambiar={elegirMes} />

          <Text variant="bodyLarge" accessibilityLiveRegion="polite">
            {fraseResumen(resumen, mes, mesActual, pagosMes.length > 0)}
          </Text>

          <Tile tone="pagos">
            <Text variant="label" className="text-mantequilla-ink">
              Cobrado
            </Text>
            <NumeroAnimado
              valor={resumen.cobrado}
              formato={formatoCOP}
              variant="number"
              numberOfLines={1}
              adjustsFontSizeToFit
              className="my-0.5 text-mantequilla-ink"
            />
            <Text variant="caption" className="text-mantequilla-ink">
              {sesiones(pagadas)} {pagadas === 1 ? 'pagada' : 'pagadas'}
            </Text>
          </Tile>
          <View className="flex-row gap-3">
            <Tile tone="neutral" className="flex-1">
              <Text variant="label">Pendiente</Text>
              <NumeroAnimado valor={resumen.pendiente} formato={formatoCOP} variant="title" numberOfLines={1} adjustsFontSizeToFit />
              <Text variant="caption" className="text-ink-soft">
                {sesiones(contar(pagosMes, 'pendiente'))}
              </Text>
            </Tile>
            <Tile tone="solidario" className="flex-1">
              <Text variant="label" className="text-durazno-ink">
                Donado
              </Text>
              <NumeroAnimado
                valor={resumen.donado}
                formato={formatoCOP}
                variant="title"
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-durazno-ink"
              />
              <Text variant="caption" className="text-durazno-ink">
                {sesiones(resumen.sesionesDonadas)} {resumen.sesionesDonadas === 1 ? 'donada' : 'donadas'}
              </Text>
            </Tile>
          </View>
          <Text variant="caption" className="text-ink-soft">
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
        </Aparecer>

        {dias.length > 0 ? (
          <Aparecer orden={3} reacomodar>
            <Seccion titulo={`Sesiones de ${nombre}`}>
              {dias.map((dia) => (
                <View key={dia.clave} className="mt-2">
                  <Text variant="label" className="text-ink-soft" accessibilityRole="header">
                    {capitalizar(fechaCorta(dia.inicio))}
                  </Text>
                  {dia.pagos.map((p, i) => (
                    <FilaMovimiento key={p.id} pago={p} last={i === dia.pagos.length - 1} />
                  ))}
                </View>
              ))}
            </Seccion>
          </Aparecer>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Seccion({ titulo, detalle, children }: { titulo: string; detalle?: ReactNode; children: ReactNode }) {
  return (
    <View className="gap-1">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text variant="heading" accessibilityRole="header">
          {titulo}
        </Text>
        {detalle}
      </View>
      <View>{children}</View>
    </View>
  );
}

function SelectorMes({ mes, puedeAvanzar, onCambiar }: { mes: string; puedeAvanzar: boolean; onCambiar: (mes: string) => void }) {
  return (
    <View className="flex-row items-center rounded-full border border-line bg-surface p-0.5">
      <BotonIcono
        etiqueta={`Mes anterior, ${mesTexto(sumarMeses(mes, -1))}`}
        onPress={() => onCambiar(sumarMeses(mes, -1))}
        icono={<CaretLeftIcon size={20} color={color.ink} />}
      />
      <Text variant="heading" accessibilityRole="header" className="flex-1 text-center">
        {capitalizar(mesTexto(mes))}
      </Text>
      <BotonIcono
        etiqueta={`Mes siguiente, ${mesTexto(sumarMeses(mes, 1))}`}
        disabled={!puedeAvanzar}
        onPress={() => onCambiar(sumarMeses(mes, 1))}
        icono={<CaretRightIcon size={20} color={color.ink} />}
      />
    </View>
  );
}

/** Sesión del mes. Cuando cambia de estado (p. ej. se paga) vuelve a entrar para que el cambio se note. */
function FilaMovimiento({ pago: p, last }: { pago: PagoConCita; last: boolean }) {
  const subtitulo =
    p.estado === 'pagado' ? `Pagado · ${etiquetaMetodo(p.metodo)}` : p.estado === 'pendiente' ? 'Pendiente' : 'Sesión donada';
  return (
    <FilaAnimada>
      <Animated.View
        key={p.estado}
        entering={FadeInDown.duration(260).reduceMotion(ReduceMotion.System)}
        layout={LinearTransition.reduceMotion(ReduceMotion.System)}>
        <ListRow
          lead={horaTexto(p.citaInicio)}
          title={p.pacienteNombre}
          subtitle={subtitulo}
          badge={p.estado === 'donado' ? <SolidarioMark /> : null}
          last={last}
          trailing={
            p.estado === 'donado' ? null : (
              <Text variant="mono" className={p.estado === 'pendiente' ? 'text-ink-soft' : 'text-ink'}>
                {formatoCOP(p.monto)}
              </Text>
            )
          }
        />
      </Animated.View>
    </FilaAnimada>
  );
}
