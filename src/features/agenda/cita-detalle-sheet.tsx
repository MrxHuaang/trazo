import { router, useLocalSearchParams } from 'expo-router';
import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { NotePencilIcon } from 'phosphor-react-native/src/icons/NotePencil';
import { WhatsappLogoIcon } from 'phosphor-react-native/src/icons/WhatsappLogo';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCambiarEstadoCita, useCita, useConsultorio, useMarcarRecordada } from '@/data/hooks';
import { ErrorSolape, type CitaConPaciente, type EstadoCita } from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto } from '@/lib/dates';
import { abrirWhatsApp } from '@/lib/whatsapp';
import { cn } from '@/lib/cn';
import { color, tile } from '@/theme';
import { Aparecer, Button, EmptyState, HatchOverlay, ListRow, Sheet, SheetHeader, SolidarioMark, Text, TraceLine } from '@/ui';

import { confirmar } from './confirmar';
import { cancelarAviso, programarAviso } from './notifications';
import { detallePaciente } from './paciente-selector';
import { PagoSeccion } from './pago-seccion';
import { ReprogramarPanel } from './reprogramar-panel';
import { duracionMin, ETIQUETA_ESTADO, ETIQUETA_MODALIDAD, fechaTitulo, mensajeCita, rangoHoras } from './rules';
import { useAhoraMs } from './use-ahora-ms';

const REACOMODO = LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System);
const CAMBIO = FadeIn.duration(220).reduceMotion(ReduceMotion.System);
const LLEGA = FadeInDown.springify().damping(18).reduceMotion(ReduceMotion.System);

/** Detalle de una cita (HU-05): estado, recordatorio por WhatsApp, reprogramar, pago y nota. */
export function CitaDetalleSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const citaQ = useCita(id);
  const cita = citaQ.data;

  if (citaQ.isPending) {
    return (
      <Sheet header={<SheetHeader title="Cita" />}>
        <TraceLine height={40} />
      </Sheet>
    );
  }
  if (!cita) {
    return (
      <Sheet header={<SheetHeader title="Cita" />}>
        <EmptyState title="Esta cita ya no existe" body="Pudo borrarse desde otro lugar. Vuelve a la agenda para ver el día." />
      </Sheet>
    );
  }
  return <Detalle cita={cita} />;
}

function Detalle({ cita }: { cita: CitaConPaciente }) {
  const insets = useSafeAreaInsets();
  const consultorio = useConsultorio().data;
  const ahoraMs = useAhoraMs();
  const cambiarEstado = useCambiarEstadoCita();
  const marcarRecordada = useMarcarRecordada();

  const [reprogramando, setReprogramando] = useState(false);
  const [recienConfirmada, setRecienConfirmada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enCurso, setEnCurso] = useState<EstadoCita | null>(null);

  const solicitada = cita.estado === 'solicitada';
  const confirmada = cita.estado === 'confirmada';
  const activa = solicitada || confirmada;
  const yaEmpezo = new Date(cita.inicio).getTime() <= ahoraMs;
  const telefono = cita.paciente.telefono;
  const tinta = solicitada ? 'text-accent' : cita.esSolidaria ? 'text-durazno-ink' : 'text-lavanda-ink';

  const cambiar = async (estado: EstadoCita) => {
    setError(null);
    setEnCurso(estado);
    try {
      const nueva = await cambiarEstado.mutateAsync({ id: cita.id, estado });
      if (estado !== 'cancelada') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (estado === 'confirmada') {
        await programarAviso(nueva.id, nueva.inicio);
        setRecienConfirmada(true);
      } else {
        await cancelarAviso(nueva.id);
      }
    } catch (e) {
      setError(
        e instanceof ErrorSolape || (e instanceof Error && e.name === 'ErrorSolape')
          ? 'No se puede confirmar: el horario se cruza con otra cita. Reprograma esta o la otra.'
          : 'No se pudo actualizar la cita. Intenta de nuevo.',
      );
    } finally {
      setEnCurso(null);
    }
  };

  const cancelar = async () => {
    const seguir = await confirmar({
      titulo: 'Cancelar la cita',
      mensaje: 'El horario queda libre y se quita el aviso. La cita sigue en el historial del paciente.',
      aceptar: 'Cancelar cita',
      destructiva: true,
    });
    if (seguir) await cambiar('cancelada');
  };

  const enviar = async (plantilla: string, marcar: boolean) => {
    if (!telefono) return;
    setError(null);
    try {
      await abrirWhatsApp(telefono, mensajeCita(plantilla, cita));
      if (marcar) await marcarRecordada.mutateAsync(cita.id);
    } catch {
      setError('No se pudo abrir WhatsApp en este dispositivo.');
    }
  };

  const abrirEnlace = async () => {
    if (!cita.enlace) return;
    try {
      await Linking.openURL(cita.enlace);
    } catch {
      setError('No se pudo abrir el enlace de la videollamada.');
    }
  };

  // Las hojas son modales: para ir a otra pantalla se reemplaza la hoja en vez de apilar encima.
  const abrirFicha = () => router.replace({ pathname: '/paciente/[id]', params: { id: cita.pacienteId } });
  const abrirNota = () => router.replace({ pathname: '/nota/[id]', params: { id: cita.id } });
  const agendarDeNuevo = () => router.replace({ pathname: '/cita/nueva', params: { pacienteId: cita.pacienteId } });

  const ocupado = enCurso !== null;
  const whatsapp = (tinta: string) => <WhatsappLogoIcon size={20} color={tinta} />;

  const botonesAsistencia = (
    <View className="flex-row gap-2">
      <Button
        label="Asistió"
        variant={yaEmpezo ? 'primary' : 'secondary'}
        onPress={() => cambiar('asistio')}
        loading={enCurso === 'asistio'}
        disabled={ocupado}
        className="flex-1"
      />
      <Button
        label="No asistió"
        variant="secondary"
        onPress={() => cambiar('no_asistio')}
        loading={enCurso === 'no_asistio'}
        disabled={ocupado}
        className="flex-1"
      />
    </View>
  );

  const botonRecordar = (
    <View className="gap-1">
      <Button
        label={cita.recordadaEn ? 'Recordar de nuevo por WhatsApp' : 'Recordar por WhatsApp'}
        variant={yaEmpezo ? 'secondary' : 'accent'}
        icon={whatsapp(yaEmpezo ? color.ink : color.onAccent)}
        onPress={() => consultorio && enviar(consultorio.plantillaRecordatorio, true)}
        disabled={!telefono || !consultorio}
      />
      <Text variant="caption" className="text-ink-soft">
        {!telefono
          ? 'Este paciente no tiene teléfono. Agrégalo en su ficha para escribirle por WhatsApp.'
          : cita.recordadaEn
            ? `Recordada el ${fechaCorta(cita.recordadaEn)} a las ${horaTexto(cita.recordadaEn)}.`
            : 'Abre WhatsApp con el mensaje de tu plantilla ya escrito.'}
      </Text>
    </View>
  );

  return (
    <Sheet
      header={
        <SheetHeader title={cita.paciente.nombre} subtitle={`${fechaCorta(cita.inicio)} · ${rangoHoras(cita)}`} />
      }>
      <Aparecer orden={0}>
        <Animated.View
          layout={REACOMODO}
          className={cn(
            'gap-0.5 overflow-hidden rounded-tile p-4',
            solicitada
              ? 'border-[1.5px] border-dashed border-accent bg-surface'
              : cita.esSolidaria
                ? 'bg-durazno'
                : 'bg-lavanda',
            cita.estado === 'no_asistio' && 'border-[1.5px] border-danger',
          )}
          accessible
          accessibilityLabel={`${ETIQUETA_ESTADO[cita.estado]}. ${fechaTitulo(fechaClave(cita.inicio))}, ${rangoHoras(cita)}. ${ETIQUETA_MODALIDAD[cita.modalidad]}${cita.esSolidaria ? ', cupo solidario' : ''}.`}>
          {cita.esSolidaria && !solicitada ? <HatchOverlay color={tile.solidario.fg} /> : null}
          <View className="flex-row items-center justify-between gap-2">
            <Animated.View key={cita.estado} entering={CAMBIO} className="shrink">
              <Text variant="label" className={tinta}>
                {ETIQUETA_ESTADO[cita.estado]}
                {cita.origen === 'web' ? ' · desde la web' : ''}
              </Text>
            </Animated.View>
            {cita.esSolidaria && solicitada ? <SolidarioMark /> : null}
          </View>
          <Animated.View key={cita.inicio} entering={CAMBIO}>
            <Text variant="number" className={tinta}>
              {horaTexto(cita.inicio)}
            </Text>
            <Text variant="bodyMedium" className={tinta}>
              {fechaTitulo(fechaClave(cita.inicio))} · {duracionMin(cita)} min
            </Text>
          </Animated.View>
          <Text variant="caption" className={tinta}>
            {ETIQUETA_MODALIDAD[cita.modalidad]}
            {cita.esSolidaria ? ' · Cupo solidario' : ''}
          </Text>
        </Animated.View>
      </Aparecer>

      <Aparecer orden={1} reacomodar>
        <ListRow
          title={cita.paciente.nombre}
          subtitle={detallePaciente(cita.paciente)}
          badge={cita.paciente.afectadoSismo ? <SolidarioMark /> : null}
          trailing={<CaretRightIcon size={18} color={color.inkSoft} />}
          onPress={abrirFicha}
          last={cita.modalidad !== 'virtual' && !cita.motivo}
        />
        {cita.modalidad === 'virtual' ? (
          <ListRow
            title="Videollamada"
            subtitle={cita.enlace ?? 'Sin enlace guardado'}
            trailing={
              cita.enlace ? (
                <Text variant="label" className="text-accent">
                  Abrir
                </Text>
              ) : null
            }
            onPress={cita.enlace ? abrirEnlace : undefined}
            last={!cita.motivo}
          />
        ) : null}
        {cita.motivo ? (
          <View className="gap-0.5 py-3">
            <Text variant="label" className="text-ink-soft">
              Motivo
            </Text>
            <Text variant="body">{cita.motivo}</Text>
          </View>
        ) : null}
      </Aparecer>

      {error ? (
        <Animated.View entering={CAMBIO}>
          <Text variant="label" className="text-danger" accessibilityRole="alert">
            {error}
          </Text>
        </Animated.View>
      ) : null}

      {recienConfirmada && confirmada ? (
        <Animated.View entering={LLEGA} layout={REACOMODO} className="gap-2 rounded-tile bg-menta p-4">
          <Text variant="bodyMedium" className="text-menta-ink">
            Cita confirmada
          </Text>
          <Text variant="caption" className="text-menta-ink">
            {telefono
              ? 'Avísale al paciente con el mensaje de confirmación.'
              : 'Este paciente no tiene teléfono, así que no se le puede escribir por WhatsApp.'}
          </Text>
          <Button
            label="Enviar confirmación por WhatsApp"
            variant="primary"
            icon={whatsapp(color.onAccent)}
            onPress={() => consultorio && enviar(consultorio.plantillaConfirmacion, false)}
            disabled={!telefono || !consultorio}
          />
        </Animated.View>
      ) : null}

      {reprogramando && activa ? (
        <ReprogramarPanel
          cita={cita}
          ahoraMs={ahoraMs}
          onCerrar={() => setReprogramando(false)}
          onListo={() => setReprogramando(false)}
        />
      ) : (
        <Aparecer orden={2} reacomodar className="gap-2">
          {solicitada ? (
            <Button
              label="Confirmar cita"
              onPress={() => cambiar('confirmada')}
              loading={enCurso === 'confirmada'}
              disabled={ocupado}
            />
          ) : null}

          {confirmada && !recienConfirmada ? (
            yaEmpezo ? (
              <>
                {botonesAsistencia}
                {botonRecordar}
              </>
            ) : (
              <>
                {botonRecordar}
                {botonesAsistencia}
              </>
            )
          ) : null}
          {confirmada && recienConfirmada ? botonesAsistencia : null}

          {cita.estado === 'no_asistio' ? (
            <Button
              label="Marcar que sí asistió"
              variant="secondary"
              onPress={() => cambiar('asistio')}
              loading={enCurso === 'asistio'}
              disabled={ocupado}
            />
          ) : null}

          {activa ? (
            <>
              <Button
                label="Reprogramar"
                variant="secondary"
                icon={<ArrowsClockwiseIcon size={20} color={color.ink} />}
                onPress={() => setReprogramando(true)}
                disabled={ocupado}
              />
              <Button
                label={solicitada ? 'Rechazar solicitud' : 'Cancelar cita'}
                variant="danger"
                onPress={cancelar}
                loading={enCurso === 'cancelada'}
                disabled={ocupado}
              />
            </>
          ) : null}

          {cita.estado === 'cancelada' || cita.estado === 'no_asistio' ? (
            <Button label="Agendar de nuevo" variant={cita.estado === 'cancelada' ? 'primary' : 'ghost'} onPress={agendarDeNuevo} />
          ) : null}
        </Aparecer>
      )}

      <Aparecer orden={3} reacomodar>
        <PagoSeccion citaId={cita.id} />
      </Aparecer>

      {confirmada || cita.estado === 'asistio' ? (
        <Animated.View entering={CAMBIO} layout={REACOMODO}>
          <Button
            label="Nota de sesión"
            variant="secondary"
            icon={<NotePencilIcon size={20} color={color.ink} />}
            onPress={abrirNota}
            accessibilityHint="Abre la nota privada de esta sesión"
          />
        </Animated.View>
      ) : null}
      {/* La hoja no tiene pie fijo: deja libre el indicador de inicio del iPhone. */}
      <View style={{ height: insets.bottom }} />
    </Sheet>
  );
}
