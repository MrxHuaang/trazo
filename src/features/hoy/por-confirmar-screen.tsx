import { StyleSheet, View } from 'react-native';

import { useCitasPorConfirmar } from '@/data/hooks';
import { fechaClave, horaTexto } from '@/lib/dates';
import { color, space } from '@/theme';
import { EmptyState, ListRow, Sheet, SheetHeader, SolidarioMark, Text } from '@/ui';

import { Accion } from './accion';
import { diaRelativo, plural } from './rules';
import { useAhora } from './use-ahora';
import { useRecordar } from './use-recordar';

/**
 * "Por confirmar" (RN-04, HU-06): citas confirmadas de las próximas 24 horas que aún no se han recordado.
 * "Recordar" abre WhatsApp con la plantilla y la cita sale de la lista.
 */
export function PorConfirmarScreen() {
  const hoy = fechaClave(useAhora());
  const { data: citas = [], isPending } = useCitasPorConfirmar();
  const { recordar, marcando, disponible } = useRecordar();

  return (
    <Sheet
      header={
        <SheetHeader
          title="Por confirmar"
          subtitle={isPending ? 'Próximas 24 horas' : `Próximas 24 horas · ${plural(citas.length, 'cita', 'citas')}`}
        />
      }>
      {!isPending && citas.length === 0 ? (
        <EmptyState
          title="Todo recordado"
          body="No hay citas confirmadas en las próximas 24 horas sin recordatorio. Cuando las haya, aparecen aquí un día antes."
        />
      ) : (
        <View>
          {citas.map((c, i) => {
            const sinTelefono = !c.paciente.telefono;
            return (
              <ListRow
                key={c.id}
                lead={horaTexto(c.inicio)}
                title={c.paciente.nombre}
                subtitle={
                  sinTelefono
                    ? `${diaRelativo(c.inicio, hoy)} · sin teléfono, agrégalo en su ficha`
                    : `${diaRelativo(c.inicio, hoy)} · ${c.modalidad}`
                }
                badge={c.esSolidaria ? <SolidarioMark /> : null}
                last={i === citas.length - 1}
                trailing={
                  <Accion
                    label="Recordar"
                    accessibilityLabel={
                      sinTelefono
                        ? `${c.paciente.nombre} no tiene teléfono registrado`
                        : `Recordar la cita a ${c.paciente.nombre} por WhatsApp`
                    }
                    accessibilityHint={sinTelefono ? undefined : 'Abre WhatsApp con el mensaje listo y marca la cita como recordada'}
                    disabled={sinTelefono || !disponible}
                    loading={marcando === c.id}
                    onPress={() => void recordar(c)}
                  />
                }
              />
            );
          })}
        </View>
      )}
      {citas.length > 0 ? (
        <Text variant="caption" tone={color.inkSoft} style={styles.nota}>
          El mensaje usa tu plantilla de recordatorio. Puedes cambiarla en Ajustes, Plantillas de mensajes.
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  nota: { marginTop: space.xs },
});
