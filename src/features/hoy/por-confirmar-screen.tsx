import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useCitasPorConfirmar } from '@/data/hooks';
import { fechaClave } from '@/lib/dates';
import { Aparecer, EmptyState, Sheet, SheetHeader } from '@/ui';

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
              body="Las citas de mañana aparecen aquí un día antes."
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
                    : `${diaRelativo(c.inicio, hoy)} · sin teléfono`
                }
                last={i === citas.length - 1}
              />
            ))}
          </View>
        )}
      </Sheet>
    </GestureHandlerRootView>
  );
}
