import * as Haptics from 'expo-haptics';
import { Alert, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { useRegistrarPago } from '@/data/hooks';
import { METODOS_PAGO, type PagoConCita } from '@/domain/types';
import { Accion } from '@/features/hoy/accion';
import { FilaAnimada } from '@/features/hoy/filas';
import { cn } from '@/lib/cn';
import { fechaCorta, horaTexto } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';
import { Button, Segmented, Text } from '@/ui';

import { usePagosStore } from './store';

type FilaPendienteProps = {
  pago: PagoConCita;
  last?: boolean;
};

/**
 * Sesión por cobrar (HU-10). "Registrar" despliega la fila: método con Segmented y Guardar.
 * Se edita en contexto; al guardar, la fila sale de la lista y pasa a las sesiones pagadas del mes.
 */
export function FilaPendiente({ pago, last }: FilaPendienteProps) {
  const abierta = usePagosStore((s) => s.filaAbierta === pago.id);
  const abrirFila = usePagosStore((s) => s.abrirFila);
  const metodo = usePagosStore((s) => s.metodo);
  const elegirMetodo = usePagosStore((s) => s.elegirMetodo);
  const registrar = useRegistrarPago();

  function guardar() {
    registrar.mutate(
      { citaId: pago.citaId, metodo },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          abrirFila(null);
        },
        onError: (e) => Alert.alert('No se registró el pago', e instanceof Error ? e.message : 'Intenta de nuevo.'),
      },
    );
  }

  return (
    <FilaAnimada>
      <View className={cn('py-2', !last && 'border-b border-line')}>
        <View className="min-h-[44px] flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="bodyMedium" numberOfLines={1}>
              {pago.pacienteNombre}
            </Text>
            <Text variant="caption" className="text-ink-soft">
              {fechaCorta(pago.citaInicio)} · {horaTexto(pago.citaInicio)}
            </Text>
          </View>
          <Text variant="mono">{formatoCOP(pago.monto)}</Text>
          {abierta ? null : (
            <Accion
              label="Registrar"
              accessibilityLabel={`Registrar el pago de ${pago.pacienteNombre}, ${formatoCOP(pago.monto)}`}
              onPress={() => abrirFila(pago.id)}
            />
          )}
        </View>
        {abierta ? (
          <Animated.View entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)} className="gap-3 pb-1 pt-3">
            <Text variant="label" className="text-ink-soft">
              Método de pago
            </Text>
            <Segmented options={METODOS_PAGO} value={metodo} onChange={elegirMetodo} accessibilityLabel="Método de pago" />
            <View className="flex-row justify-end gap-2">
              <Button label="Cancelar" variant="ghost" onPress={() => abrirFila(null)} disabled={registrar.isPending} />
              <Button
                label={`Guardar ${formatoCOP(pago.monto)}`}
                variant="accent"
                loading={registrar.isPending}
                onPress={guardar}
                accessibilityHint={`Marca la sesión como pagada por ${METODOS_PAGO.find((m) => m.valor === metodo)?.etiqueta ?? metodo}`}
              />
            </View>
          </Animated.View>
        ) : null}
      </View>
    </FilaAnimada>
  );
}
