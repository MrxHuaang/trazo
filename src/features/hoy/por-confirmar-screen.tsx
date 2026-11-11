import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useCitasPorConfirmar } from '@/data/hooks';
import { fechaClave } from '@/lib/dates';
import { Aparecer, EmptyState, Sheet, SheetHeader, Text } from '@/ui';

import { FilaCita } from './filas';
import { diaRelativo, plural } from './rules';
import { useAhora } from './use-ahora';

/**
 * "Por confirmar" (RN-04, HU-06): citas confirmadas de las próximas 24 horas que aún no se han recordado.
 * "Recordar" (botón o deslizar a la derecha) abre WhatsApp con la plantilla y la cita sale de la lista.
 */
export function PorConfirmarScreen() {
  const hoy = fechaClave(useAhora());
  const { data: citas = [], isPending } = useCitasPorConfirmar();

  return (
    <GestureHandlerRootView>
      <Sheet
        header={
          <SheetHeader
            title="Por confirmar"
            subtitle={isPending ? 'Próximas 24 horas' : `Próximas 24 horas · ${plural(citas.length, 'cita', 'citas')}`}
          />
        }>
        {!isPending && citas.length === 0 ? (
          <Aparecer>
            <EmptyState
              title="Todo recordado"
              body="No hay citas confirmadas en las próximas 24 horas sin recordatorio. Cuando las haya, aparecen aquí un día antes."
            />
          </Aparecer>
        ) : (
          <View>
            {citas.map((c, i) => (
              <FilaCita
                key={c.id}
                cita={c}
                subtitulo={
                  c.paciente.telefono
                    ? `${diaRelativo(c.inicio, hoy)} · ${c.modalidad}`
                    : `${diaRelativo(c.inicio, hoy)} · sin teléfono, agrégalo en su ficha`
                }
                last={i === citas.length - 1}
              />
            ))}
          </View>
        )}
        {citas.length > 0 ? (
          <Aparecer reacomodar>
            <Text variant="caption" className="text-ink-soft">
              Desliza una fila a la derecha para recordar o a la izquierda para marcar que asistió. El mensaje usa tu plantilla de
              recordatorio; puedes cambiarla en Ajustes, Plantillas de mensajes.
            </Text>
          </Aparecer>
        ) : null}
      </Sheet>
    </GestureHandlerRootView>
  );
}
