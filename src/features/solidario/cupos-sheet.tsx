import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useActualizarConsultorio, useConsultorio, useCuposSolidariosSemana } from '@/data/hooks';
import type { Consultorio } from '@/domain/types';
import { formatoCOP } from '@/lib/format';
import { color, space, tile } from '@/theme';
import { Button, EmptyState, Field, Sheet, SheetHeader, Text, Tile } from '@/ui';

import { MedidorCupos } from './components/medidor-cupos';
import { Stepper } from './components/stepper';
import { avisarError } from './dispositivo';
import { estadoCupos } from './rules';

const MAX_CUPOS = 20;

/** Hoja "Cupos solidarios" (HU-18): cupos por semana y valor de la tarifa social. */
export function CuposSheet() {
  const consultorio = useConsultorio();

  if (!consultorio.data) {
    return (
      <Sheet header={<SheetHeader title="Cupos solidarios" />}>
        {consultorio.isLoading ? null : (
          <EmptyState title="Aún no hay consultorio" body="Crea tu consultorio para definir los cupos solidarios." />
        )}
      </Sheet>
    );
  }
  return <CuposForm consultorio={consultorio.data} />;
}

function CuposForm({ consultorio }: { consultorio: Consultorio }) {
  const [cupos, setCupos] = useState(consultorio.cuposSolidariosSemana);
  const [tarifa, setTarifa] = useState(String(consultorio.tarifaSocial));
  const usados = useCuposSolidariosSemana().data ?? 0;
  const actualizar = useActualizarConsultorio();

  const valorTarifa = Number(tarifa || '0');
  const errorTarifa = !tarifa
    ? 'Escribe el valor de la tarifa social.'
    : valorTarifa > consultorio.tarifaBase
      ? `Debe ser menor o igual a la tarifa normal (${formatoCOP(consultorio.tarifaBase)}).`
      : undefined;
  const estado = estadoCupos(usados, cupos);
  const fg = tile.solidario.fg;

  const guardar = () => {
    if (errorTarifa) return;
    actualizar.mutate(
      { cuposSolidariosSemana: cupos, tarifaSocial: valorTarifa },
      { onSuccess: () => router.back(), onError: avisarError('No se pudo guardar') },
    );
  };

  return (
    <Sheet
      header={<SheetHeader title="Cupos solidarios" subtitle="Programa post-sismo" />}
      footer={<Button label="Guardar" onPress={guardar} loading={actualizar.isPending} disabled={!!errorTarifa} />}>
      <Text variant="body" tone={color.inkSoft}>
        Define cuánto tiempo puedes donar sin desbordarte. La semana va de lunes a domingo.
      </Text>

      <Tile tone="solidario" contentStyle={styles.bloque}>
        <Text variant="label" tone={fg}>
          Cupos por semana
        </Text>
        <Stepper label="Cupos solidarios por semana" value={cupos} onChange={setCupos} min={0} max={MAX_CUPOS} unidad="por semana" tono="durazno" />
        <MedidorCupos usados={usados} total={cupos} />
        <Text variant="caption" tone={fg}>
          Esta semana llevas {usados} de {cupos}. {estado.detalle}
        </Text>
      </Tile>

      <View style={styles.bloque}>
        <Field
          label="Tarifa social (COP)"
          value={tarifa}
          onChangeText={(t) => setTarifa(t.replace(/\D/g, '').slice(0, 7))}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          error={errorTarifa}
          helper={`${formatoCOP(valorTarifa)} por sesión. La tarifa normal es ${formatoCOP(consultorio.tarifaBase)}.`}
        />
        <Text variant="caption" tone={color.inkSoft}>
          Los pacientes con tarifa gratuita no pagan: sus sesiones cuentan como donadas en el informe del mes. Si agendas más
          citas solidarias que los cupos, la agenda te pedirá confirmarlo.
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: space.md },
});
