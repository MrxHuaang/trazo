import { useState } from 'react';
import Animated, { FadeIn, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { usePagoDeCita, useRegistrarPago } from '@/data/hooks';
import { METODOS_PAGO, type MetodoPago } from '@/domain/types';
import { fechaCorta } from '@/lib/dates';
import { formatoCOP } from '@/lib/format';
import { Button, NumeroAnimado, Text, Tile } from '@/ui';

import { Opciones } from './selectores';

/** Método dentro de una frase: las marcas conservan la mayúscula ('Nequi'), lo demás va en minúscula ('efectivo'). */
function metodoEnFrase(m: MetodoPago | null) {
  const etiqueta = METODOS_PAGO.find((x) => x.valor === m)?.etiqueta;
  if (!etiqueta) return 'otro medio';
  return m === 'nequi' || m === 'daviplata' ? etiqueta : etiqueta.toLowerCase();
}

/**
 * Pago de la cita (RN-05: se crea al marcar "asistió"). Muestra el estado y, si está pendiente,
 * permite registrarlo eligiendo el método.
 */
export function PagoSeccion({ citaId }: { citaId: string }) {
  const pago = usePagoDeCita(citaId).data;
  const registrar = useRegistrarPago();
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!pago) return null;

  const estado =
    pago.estado === 'pagado'
      ? `Pagado con ${metodoEnFrase(pago.metodo)}${pago.pagadoEn ? ` el ${fechaCorta(pago.pagadoEn)}` : ''}`
      : pago.estado === 'donado'
        ? 'Sesión donada, sin cobro'
        : 'Pendiente de pago';

  const guardar = async () => {
    if (!metodo) return;
    setError(null);
    try {
      await registrar.mutateAsync({ citaId, metodo });
    } catch {
      setError('No se pudo registrar el pago. Intenta de nuevo.');
    }
  };

  return (
    <Animated.View layout={LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System)} className="gap-2">
      <Text variant="heading">Pago</Text>
      <Tile tone="pagos" contentClassName="flex-row items-center justify-between gap-3">
        <Animated.View key={pago.estado} entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)} className="flex-1">
          <Text variant="label" className="text-mantequilla-ink">
            {estado}
          </Text>
        </Animated.View>
        <NumeroAnimado
          variant="heading"
          valor={pago.estado === 'donado' ? 0 : pago.monto}
          formato={formatoCOP}
          className="font-mono text-mantequilla-ink"
        />
      </Tile>
      {pago.estado === 'pendiente' ? (
        <>
          <Text variant="label">Método</Text>
          <Opciones opciones={METODOS_PAGO} valor={metodo} onChange={setMetodo} />
          {error ? (
            <Text variant="caption" className="text-danger">
              {error}
            </Text>
          ) : null}
          <Button
            label={metodo ? `Registrar pago con ${metodoEnFrase(metodo)}` : 'Registrar pago'}
            variant="accent"
            onPress={guardar}
            loading={registrar.isPending}
            disabled={!metodo}
            accessibilityHint={metodo ? undefined : 'Elige primero el método de pago'}
          />
        </>
      ) : null}
    </Animated.View>
  );
}
