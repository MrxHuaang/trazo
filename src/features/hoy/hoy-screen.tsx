import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { useCallback, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  useActualizarSeguimiento,
  useCitasDelDia,
  useCitasPorConfirmar,
  useCitasSolicitadas,
  useConsultorio,
  useCuposSolidariosSemana,
  usePagosPendientes,
  useSeguimientos,
} from '@/data/hooks';
import { qk } from '@/data/keys';
import type { CitaConPaciente, Seguimiento } from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto, isoDesde } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';
import { abrirWhatsApp, llamar } from '@/lib/whatsapp';
import { color, radius, space, tile } from '@/theme';
import { Fab, ListRow, Screen, SolidarioMark, Text, Tile, TraceLine } from '@/ui';

import { Accion } from './accion';
import { useParaContactar, useRegistrarContacto } from './hooks';
import { mensajeContacto } from './mensajes';
import { diaRelativo, etiquetaProxima, nodosDelDia, plural, proximaCita, siguientesCitas, type ParaContactar } from './rules';
import { Segmentos } from './segmentos';
import { useAhora } from './use-ahora';
import { useRecordar } from './use-recordar';

const abrirCita = (id: string) => router.push({ pathname: '/cita/[id]', params: { id } });

/** "Hoy" (HU-02): la línea del día y un bloque por cada pendiente; debajo, lo que pide acción. */
export function HoyScreen() {
  const ahora = useAhora();
  const ahoraMs = ahora.getTime();
  const hoy = fechaClave(ahora);
  const qc = useQueryClient();

  const citasQ = useCitasDelDia(hoy);
  const porConfirmarQ = useCitasPorConfirmar();
  const solicitadasQ = useCitasSolicitadas();
  const cuposQ = useCuposSolidariosSemana(hoy);
  const pendientesQ = usePagosPendientes();
  const seguimientosQ = useSeguimientos({ estado: 'pendiente', hasta: hoy });
  const contactarQ = useParaContactar();
  const { data: consultorio } = useConsultorio();

  // Las listas que dependen de la hora (próximas 24 h, solicitudes futuras) se recalculan al volver a "Hoy".
  useFocusEffect(
    useCallback(() => {
      void qc.invalidateQueries({ queryKey: [...qk.citas, 'por-confirmar'] });
      void qc.invalidateQueries({ queryKey: [...qk.citas, 'solicitadas'] });
    }, [qc]),
  );

  const citas = citasQ.data ?? [];
  const proxima = proximaCita(citas, ahoraMs);
  const siguientes = siguientesCitas(citas, ahoraMs);
  const porConfirmar = porConfirmarQ.data?.length ?? 0;
  const solicitadas = solicitadasQ.data ?? [];
  const cuposUsados = cuposQ.data ?? 0;
  const cuposTotal = consultorio?.cuposSolidariosSemana ?? 0;
  const pendientes = pendientesQ.data ?? [];
  const porCobrar = pendientes.reduce((suma, p) => suma + p.monto, 0);
  const seguimientos = seguimientosQ.data ?? [];
  const paraContactar = contactarQ.data ?? [];

  return (
    <Screen overlay={<Fab label="Agendar" onPress={() => router.push('/cita/nueva')} />}>
      <View style={styles.header}>
        <View style={styles.titulo}>
          <Text variant="display" accessibilityRole="header">
            Hoy
          </Text>
          <Text variant="caption" tone={color.inkSoft}>
            {fechaCorta(ahora.toISOString())}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajustes"
          onPress={() => router.push('/ajustes')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}>
          <GearSixIcon size={24} color={color.ink} />
        </Pressable>
      </View>

      <TraceLine height={44} nodes={nodosDelDia(citas, ahoraMs)} style={styles.trace} />

      {proxima ? (
        <Tile
          tone="consulta"
          onPress={() => abrirCita(proxima.id)}
          accessibilityLabel={`${etiquetaProxima(proxima, ahoraMs)}. ${horaTexto(proxima.inicio)}, ${proxima.paciente.nombre}, ${proxima.modalidad}${proxima.esSolidaria ? ', cupo solidario' : ''}`}>
          <Text variant="label" tone={tile.consulta.fg}>
            {etiquetaProxima(proxima, ahoraMs)}
          </Text>
          <Text variant="number" tone={tile.consulta.fg} style={styles.number}>
            {horaTexto(proxima.inicio)}
          </Text>
          <View style={styles.inline}>
            <Text variant="bodyMedium" tone={tile.consulta.fg} numberOfLines={1} style={styles.shrink}>
              {proxima.paciente.nombre} · {proxima.modalidad}
            </Text>
            {proxima.esSolidaria ? <SolidarioMark /> : null}
          </View>
        </Tile>
      ) : (
        <Tile tone="consulta">
          <Text variant="bodyMedium" tone={tile.consulta.fg}>
            {citasQ.isPending ? 'Cargando citas' : 'No hay más citas hoy'}
          </Text>
        </Tile>
      )}

      <View style={styles.pair}>
        <Tile
          tone="confirmar"
          style={styles.half}
          onPress={() => router.push('/por-confirmar')}
          accessibilityLabel={`${plural(porConfirmar, 'cita', 'citas')} por confirmar`}>
          <Text variant="title" tone={tile.confirmar.fg}>
            {porConfirmar}
          </Text>
          <Text variant="label" tone={tile.confirmar.fg}>
            por confirmar
          </Text>
        </Tile>
        <Tile
          tone="solidario"
          style={styles.half}
          onPress={() => router.navigate('/solidario')}
          accessibilityLabel={`${cuposUsados} de ${cuposTotal} cupos solidarios usados esta semana`}>
          <Text variant="title" tone={tile.solidario.fg}>
            {cuposUsados}/{cuposTotal}
          </Text>
          <Text variant="label" tone={tile.solidario.fg}>
            cupos solidarios
          </Text>
          <Segmentos usados={cuposUsados} total={cuposTotal} tono={tile.solidario.fg} />
        </Tile>
      </View>

      <Tile
        tone="pagos"
        contentStyle={styles.rowTile}
        onPress={() => router.push('/pagos')}
        accessibilityLabel={`Por cobrar ${formatoCOP(porCobrar)}, ${plural(pendientes.length, 'sesión', 'sesiones')}`}>
        <View>
          <Text variant="label" tone={tile.pagos.fg}>
            Por cobrar
          </Text>
          <Text variant="caption" tone={tile.pagos.fg}>
            {pendientes.length === 0 ? 'Todo al día' : plural(pendientes.length, 'sesión', 'sesiones')}
          </Text>
        </View>
        <Text variant="heading" tone={tile.pagos.fg}>
          {formatoCOP(porCobrar)}
        </Text>
      </Tile>

      {solicitadas.length > 0 ? (
        <Seccion titulo="Solicitudes">
          {solicitadas.map((c, i) => (
            <ListRow
              key={c.id}
              lead={horaTexto(c.inicio)}
              title={c.paciente.nombre}
              subtitle={`${diaRelativo(c.inicio, hoy)} · ${c.modalidad}${c.origen === 'web' ? ' · desde la web' : ''}`}
              badge={c.esSolidaria ? <SolidarioMark /> : null}
              last={i === solicitadas.length - 1}
              onPress={() => abrirCita(c.id)}
              trailing={
                <Accion
                  label="Revisar"
                  accessibilityLabel={`Revisar la solicitud de ${c.paciente.nombre}`}
                  onPress={() => abrirCita(c.id)}
                />
              }
            />
          ))}
        </Seccion>
      ) : null}

      {seguimientos.length > 0 ? (
        <Seccion titulo="Seguimientos de hoy">
          {seguimientos.map((s, i) => (
            <FilaSeguimiento key={s.id} seguimiento={s} hoy={hoy} last={i === seguimientos.length - 1} />
          ))}
        </Seccion>
      ) : null}

      {siguientes.length > 0 ? (
        <Seccion titulo="Siguientes">
          <FilasSiguientes citas={siguientes} />
        </Seccion>
      ) : null}

      {paraContactar.length > 0 ? (
        <Seccion titulo="Para contactar">
          {paraContactar.map((p, i) => (
            <FilaContacto key={p.pacienteId} paciente={p} last={i === paraContactar.length - 1} />
          ))}
        </Seccion>
      ) : null}
    </Screen>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="heading" accessibilityRole="header">
        {titulo}
      </Text>
      <View>{children}</View>
    </View>
  );
}

/** Resto de citas del día, con "Recordar" (HU-06) mientras no se haya enviado el recordatorio. */
function FilasSiguientes({ citas }: { citas: CitaConPaciente[] }) {
  const { recordar, marcando, disponible } = useRecordar();
  return citas.map((c, i) => (
    <ListRow
      key={c.id}
      lead={horaTexto(c.inicio)}
      title={c.paciente.nombre}
      subtitle={c.modalidad}
      badge={c.esSolidaria ? <SolidarioMark /> : null}
      last={i === citas.length - 1}
      onPress={() => abrirCita(c.id)}
      trailing={
        c.recordadaEn ? (
          <Text variant="caption" tone={color.inkSoft}>
            Recordada
          </Text>
        ) : !c.paciente.telefono ? (
          <Text variant="caption" tone={color.inkSoft}>
            Sin teléfono
          </Text>
        ) : (
          <Accion
            label="Recordar"
            accessibilityLabel={`Recordar la cita a ${c.paciente.nombre} por WhatsApp`}
            disabled={!disponible}
            loading={marcando === c.id}
            onPress={() => void recordar(c)}
          />
        )
      }
    />
  ));
}

function FilaSeguimiento({ seguimiento: s, hoy, last }: { seguimiento: Seguimiento; hoy: string; last: boolean }) {
  const actualizar = useActualizarSeguimiento();
  const cuando = s.fechaObjetivo === hoy ? 'Hoy' : `Desde el ${fechaCorta(isoDesde(s.fechaObjetivo))}`;
  const telefono = s.telefono;
  return (
    <ListRow
      title={s.nombre}
      subtitle={`${cuando} · ${s.motivo}`}
      last={last}
      trailing={
        <View style={styles.acciones}>
          <Accion
            label="Llamar"
            accessibilityLabel={telefono ? `Llamar a ${s.nombre}` : `${s.nombre} no tiene teléfono registrado`}
            disabled={!telefono}
            onPress={() => {
              if (telefono) void llamar(telefono).catch(() => Alert.alert('No se pudo iniciar la llamada'));
            }}
          />
          <Accion
            label="Hecho"
            accessibilityLabel={`Marcar como hecho el seguimiento de ${s.nombre}`}
            loading={actualizar.isPending}
            onPress={() => actualizar.mutate({ id: s.id, cambios: { estado: 'hecho' } })}
          />
        </View>
      }
    />
  );
}

/** RN-06: dos inasistencias seguidas. El contacto queda como seguimiento hecho y la fila desaparece. */
function FilaContacto({ paciente: p, last }: { paciente: ParaContactar; last: boolean }) {
  const registrar = useRegistrarContacto();
  const telefono = p.telefono;

  async function escribir() {
    if (!telefono) return;
    try {
      await abrirWhatsApp(telefono, mensajeContacto(p.nombre));
    } catch {
      Alert.alert('No se pudo abrir WhatsApp', 'Revisa que WhatsApp esté instalado en este teléfono.');
      return;
    }
    registrar.mutate({ pacienteId: p.pacienteId, nombre: p.nombre, telefono });
  }

  return (
    <ListRow
      title={p.nombre}
      subtitle={telefono ? 'Dos inasistencias seguidas' : 'Dos inasistencias seguidas · sin teléfono'}
      last={last}
      onPress={() => router.push({ pathname: '/paciente/[id]', params: { id: p.pacienteId } })}
      trailing={
        <Accion
          label="WhatsApp"
          accessibilityLabel={telefono ? `Escribir a ${p.nombre} por WhatsApp` : `${p.nombre} no tiene teléfono registrado`}
          disabled={!telefono}
          loading={registrar.isPending}
          onPress={() => void escribir()}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  iconButton: {
    width: 44,
    height: 44,
    marginRight: -space.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPressed: { backgroundColor: color.quiet },
  trace: { marginBottom: space.xs },
  number: { marginVertical: 2 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  shrink: { flexShrink: 1 },
  pair: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
  rowTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  section: { marginTop: space.md, gap: space.xs },
  acciones: { flexDirection: 'row', alignItems: 'center' },
});
