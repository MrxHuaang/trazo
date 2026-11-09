import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Alert, StyleSheet, View } from 'react-native';

import { color, space, tile } from '@/theme';
import { Chip, Fab, ListRow, Screen, SolidarioMark, Text, Tile, TraceLine } from '@/ui';

import { citasHoyDemo, minutosDemo, resumenDemo } from '../demo/demo-data';
import { formatoCOP, horaTexto, nodosDelDia, proximaCita, siguientesCitas, tiempoHasta } from './rules';
import { useAhora } from './use-ahora';

const pendiente = (titulo: string, sprint: string) => () =>
  Alert.alert(titulo, `Esta función llega en el ${sprint}.`);

/** "Hoy": la línea del día y un bloque por cada pendiente. */
export function HoyScreen() {
  const ahora = useAhora();
  const ahoraMin = minutosDemo(ahora.getHours(), ahora.getMinutes());
  const citas = citasHoyDemo;
  const proxima = proximaCita(citas, ahoraMin);
  const siguientes = siguientesCitas(citas, ahoraMin);
  const { porConfirmar, cuposSolidarios, porCobrarCOP } = resumenDemo;

  return (
    <Screen overlay={<Fab label="Agendar" onPress={pendiente('Agendar', 'sprint 2')} />}>
      <View style={styles.header}>
        <Text variant="display" accessibilityRole="header">
          Hoy
        </Text>
        <Text variant="caption" tone={color.inkSoft}>
          {format(ahora, 'EEE d MMM', { locale: es })}
        </Text>
      </View>

      <TraceLine height={44} nodes={nodosDelDia(citas, ahoraMin)} style={styles.trace} />

      {proxima ? (
        <Tile
          tone="consulta"
          onPress={pendiente('Detalle de la cita', 'sprint 2')}
          accessibilityLabel={`Próxima cita a las ${horaTexto(proxima.inicioMin)} con ${proxima.paciente}`}>
          <Text variant="label" tone={tile.consulta.fg}>
            Próxima, {tiempoHasta(proxima.inicioMin, ahoraMin)}
          </Text>
          <Text variant="number" tone={tile.consulta.fg} style={styles.number}>
            {horaTexto(proxima.inicioMin)}
          </Text>
          <Text variant="bodyMedium" tone={tile.consulta.fg}>
            {proxima.paciente} · {proxima.modalidad}
          </Text>
        </Tile>
      ) : (
        <Tile tone="consulta">
          <Text variant="bodyMedium" tone={tile.consulta.fg}>
            No hay más citas hoy.
          </Text>
        </Tile>
      )}

      <View style={styles.pair}>
        <Tile
          tone="confirmar"
          style={styles.half}
          onPress={pendiente('Por confirmar', 'sprint 3')}
          accessibilityLabel={`${porConfirmar} citas por confirmar`}>
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
          onPress={pendiente('Cupos solidarios', 'sprint 4')}
          accessibilityLabel={`${cuposSolidarios.usados} de ${cuposSolidarios.total} cupos solidarios usados`}>
          <Text variant="title" tone={tile.solidario.fg}>
            {cuposSolidarios.usados}/{cuposSolidarios.total}
          </Text>
          <Text variant="label" tone={tile.solidario.fg}>
            cupos solidarios
          </Text>
        </Tile>
      </View>

      <Tile tone="pagos" contentStyle={styles.rowTile} onPress={pendiente('Pagos', 'sprint 3')}>
        <Text variant="label" tone={tile.pagos.fg}>
          Por cobrar
        </Text>
        <Text variant="heading" tone={tile.pagos.fg}>
          {formatoCOP(porCobrarCOP)}
        </Text>
      </Tile>

      <Text variant="heading" style={styles.section}>
        Siguientes
      </Text>
      <View>
        {siguientes.length === 0 ? (
          <Text variant="body" tone={color.inkSoft}>
            Nada más por hoy.
          </Text>
        ) : (
          siguientes.map((cita, i) => (
            <ListRow
              key={cita.id}
              lead={horaTexto(cita.inicioMin)}
              title={cita.paciente}
              subtitle={cita.modalidad}
              badge={cita.solidaria ? <SolidarioMark /> : null}
              last={i === siguientes.length - 1}
              trailing={
                cita.estado === 'solicitada' ? (
                  <Chip kind="outline" label="Solicitud" onPress={pendiente('Solicitud web', 'sprint 5')} />
                ) : (
                  <Chip label="Recordar" onPress={pendiente('Recordatorio por WhatsApp', 'sprint 3')} />
                )
              }
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  trace: { marginBottom: space.xs },
  number: { marginVertical: 2 },
  pair: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
  rowTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { marginTop: space.md },
});
