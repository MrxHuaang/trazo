import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useRegistrarPago } from '@/data/hooks';
import { METODOS_PAGO, type MetodoPago, type PagoConCita } from '@/domain/types';
import { Accion } from '@/features/hoy/accion';
import { fechaCorta, horaTexto } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';
import { color, space } from '@/theme';
import { Button, Segmented, Text } from '@/ui';

type FilaPendienteProps = {
  pago: PagoConCita;
  abierta: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  last?: boolean;
};

/**
 * Sesión por cobrar (HU-10). "Registrar" despliega la fila: método con Segmented y Guardar.
 * Se edita en contexto, sin salir de la lista.
 */
export function FilaPendiente({ pago, abierta, onAbrir, onCerrar, last }: FilaPendienteProps) {
  const [metodo, setMetodo] = useState<MetodoPago>('nequi');
  const registrar = useRegistrarPago();

  function guardar() {
    registrar.mutate(
      { citaId: pago.citaId, metodo },
      {
        onSuccess: onCerrar,
        onError: (e) => Alert.alert('No se registró el pago', e instanceof Error ? e.message : 'Intenta de nuevo.'),
      },
    );
  }

  return (
    <View style={[styles.wrap, !last && styles.divider]}>
      <View style={styles.fila}>
        <View style={styles.cuerpo}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {pago.pacienteNombre}
          </Text>
          <Text variant="caption" tone={color.inkSoft}>
            {fechaCorta(pago.citaInicio)} · {horaTexto(pago.citaInicio)}
          </Text>
        </View>
        <Text variant="mono">{formatoCOP(pago.monto)}</Text>
        {abierta ? null : (
          <Accion
            label="Registrar"
            accessibilityLabel={`Registrar el pago de ${pago.pacienteNombre}, ${formatoCOP(pago.monto)}`}
            onPress={onAbrir}
          />
        )}
      </View>
      {abierta ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.panel}>
          <Text variant="label" tone={color.inkSoft}>
            Método de pago
          </Text>
          <Segmented options={METODOS_PAGO} value={metodo} onChange={setMetodo} accessibilityLabel="Método de pago" />
          <View style={styles.botones}>
            <Button label="Cancelar" variant="ghost" onPress={onCerrar} disabled={registrar.isPending} />
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
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: space.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  cuerpo: { flex: 1, gap: 2 },
  panel: { gap: space.md, paddingTop: space.md, paddingBottom: space.xs },
  botones: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
});
