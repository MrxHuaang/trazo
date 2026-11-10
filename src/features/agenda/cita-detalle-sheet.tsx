import { router, useLocalSearchParams } from 'expo-router';
import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { NotePencilIcon } from 'phosphor-react-native/src/icons/NotePencil';
import { WhatsappLogoIcon } from 'phosphor-react-native/src/icons/WhatsappLogo';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { useCambiarEstadoCita, useCita, useConsultorio, useMarcarRecordada } from '@/data/hooks';
import { ErrorSolape, type CitaConPaciente, type EstadoCita } from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto } from '@/lib/dates';
import { abrirWhatsApp } from '@/lib/whatsapp';
import { color, radius, space, tile } from '@/theme';
import { Button, EmptyState, HatchOverlay, ListRow, Sheet, SheetHeader, SolidarioMark, Text, TraceLine } from '@/ui';

import { confirmar } from './confirmar';
import { cancelarAviso, programarAviso } from './notifications';
import { detallePaciente } from './paciente-selector';
import { PagoSeccion } from './pago-seccion';
import { ReprogramarPanel } from './reprogramar-panel';
import { duracionMin, ETIQUETA_ESTADO, ETIQUETA_MODALIDAD, fechaTitulo, mensajeCita, rangoHoras } from './rules';
import { useAhoraMs } from './use-ahora-ms';

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
  const tono = cita.esSolidaria ? tile.solidario : tile.consulta;
  const fg = solicitada ? color.accent : tono.fg;

  const cambiar = async (estado: EstadoCita) => {
    setError(null);
    setEnCurso(estado);
    try {
      const nueva = await cambiarEstado.mutateAsync({ id: cita.id, estado });
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
    <View style={styles.par}>
      <Button
        label="Asistió"
        variant={yaEmpezo ? 'primary' : 'secondary'}
        onPress={() => cambiar('asistio')}
        loading={enCurso === 'asistio'}
        disabled={ocupado}
        style={styles.mitad}
      />
      <Button
        label="No asistió"
        variant="secondary"
        onPress={() => cambiar('no_asistio')}
        loading={enCurso === 'no_asistio'}
        disabled={ocupado}
        style={styles.mitad}
      />
    </View>
  );

  const botonRecordar = (
    <View style={styles.grupo}>
      <Button
        label={cita.recordadaEn ? 'Recordar de nuevo por WhatsApp' : 'Recordar por WhatsApp'}
        variant={yaEmpezo ? 'secondary' : 'accent'}
        icon={whatsapp(yaEmpezo ? color.ink : color.onAccent)}
        onPress={() => consultorio && enviar(consultorio.plantillaRecordatorio, true)}
        disabled={!telefono || !consultorio}
      />
      <Text variant="caption" tone={color.inkSoft}>
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
      <View
        style={[
          styles.resumen,
          { backgroundColor: solicitada ? color.surface : tono.bg },
          solicitada && styles.resumenSolicitada,
          cita.estado === 'no_asistio' && styles.resumenNoAsistio,
        ]}
        accessible
        accessibilityLabel={`${ETIQUETA_ESTADO[cita.estado]}. ${fechaTitulo(fechaClave(cita.inicio))}, ${rangoHoras(cita)}. ${ETIQUETA_MODALIDAD[cita.modalidad]}${cita.esSolidaria ? ', cupo solidario' : ''}.`}>
        {cita.esSolidaria && !solicitada ? <HatchOverlay color={tile.solidario.fg} /> : null}
        <View style={styles.resumenFila}>
          <Text variant="label" tone={fg}>
            {ETIQUETA_ESTADO[cita.estado]}
            {cita.origen === 'web' ? ' · desde la web' : ''}
          </Text>
          {cita.esSolidaria && solicitada ? <SolidarioMark /> : null}
        </View>
        <Text variant="number" tone={fg}>
          {horaTexto(cita.inicio)}
        </Text>
        <Text variant="bodyMedium" tone={fg}>
          {fechaTitulo(fechaClave(cita.inicio))} · {duracionMin(cita)} min
        </Text>
        <Text variant="caption" tone={fg}>
          {ETIQUETA_MODALIDAD[cita.modalidad]}
          {cita.esSolidaria ? ' · Cupo solidario' : ''}
        </Text>
      </View>

      <View>
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
                <Text variant="label" tone={color.accent}>
                  Abrir
                </Text>
              ) : null
            }
            onPress={cita.enlace ? abrirEnlace : undefined}
            last={!cita.motivo}
          />
        ) : null}
        {cita.motivo ? (
          <View style={styles.motivo}>
            <Text variant="label" tone={color.inkSoft}>
              Motivo
            </Text>
            <Text variant="body">{cita.motivo}</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <Text variant="label" tone={color.danger} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {recienConfirmada && confirmada ? (
        <View style={styles.aviso}>
          <Text variant="bodyMedium" tone={tile.confirmar.fg}>
            Cita confirmada
          </Text>
          <Text variant="caption" tone={tile.confirmar.fg}>
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
        </View>
      ) : null}

      {reprogramando && activa ? (
        <ReprogramarPanel
          cita={cita}
          ahoraMs={ahoraMs}
          onCerrar={() => setReprogramando(false)}
          onListo={() => setReprogramando(false)}
        />
      ) : (
        <View style={styles.acciones}>
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
        </View>
      )}

      <PagoSeccion citaId={cita.id} />

      {confirmada || cita.estado === 'asistio' ? (
        <Button
          label="Nota de sesión"
          variant="secondary"
          icon={<NotePencilIcon size={20} color={color.ink} />}
          onPress={abrirNota}
          accessibilityHint="Abre la nota privada de esta sesión"
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  resumen: { borderRadius: radius.tile, padding: space.lg, gap: 2, overflow: 'hidden' },
  resumenSolicitada: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.accent },
  resumenNoAsistio: { borderWidth: 1.5, borderColor: color.danger },
  resumenFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  motivo: { paddingVertical: space.md, gap: 2 },
  aviso: { backgroundColor: tile.confirmar.bg, borderRadius: radius.tile, padding: space.lg, gap: space.sm },
  acciones: { gap: space.sm },
  grupo: { gap: space.xs },
  par: { flexDirection: 'row', gap: space.sm },
  mitad: { flex: 1 },
});
