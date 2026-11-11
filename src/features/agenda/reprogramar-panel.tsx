import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, ReduceMotion } from 'react-native-reanimated';

import { useActualizarCita } from '@/data/hooks';
import { ErrorSolape, type CitaConPaciente } from '@/domain/types';
import { fechaClave, isoDesde, sumarMinutos } from '@/lib/dates';
import { Button, Text } from '@/ui';

import { cancelarAviso, programarAviso } from './notifications';
import { diasDesde, duracionMin } from './rules';
import { SelectorHorario, useHorasDelDia } from './selector-horario';

type Props = {
  cita: CitaConPaciente;
  ahoraMs: number;
  onListo: () => void;
  onCerrar: () => void;
};

/**
 * Reprogramar: mismos selectores de fecha y hora que al agendar. Si el nuevo horario choca con
 * otra cita se explica en línea (RN-01); al guardar se mueve también el aviso local.
 */
export function ReprogramarPanel({ cita, ahoraMs, onListo, onCerrar }: Props) {
  const hoy = fechaClave(new Date(ahoraMs));
  const original = fechaClave(cita.inicio);
  const [fecha, setFecha] = useState(original < hoy ? hoy : original);
  const [hora, setHora] = useState<string | null>(null);
  const [todas, setTodas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const duracion = duracionMin(cita);
  const datos = useHorasDelDia({ fecha, hora, duracion, ahoraMs, todas, excluirCitaId: cita.id });
  const horaLista = datos.seleccion?.estado === 'libre' ? datos.seleccion.hora : null;
  const actualizar = useActualizarCita();

  const proximos = diasDesde(hoy, 21);
  const dias = proximos.includes(fecha) ? proximos : [...proximos, fecha].sort();

  const guardar = async () => {
    if (!horaLista || guardando) return;
    setError(null);
    setGuardando(true);
    try {
      const inicio = isoDesde(fecha, horaLista);
      // El recordatorio enviado era para el horario anterior: vuelve a quedar pendiente.
      const nueva = await actualizar.mutateAsync({
        id: cita.id,
        cambios: { inicio, fin: sumarMinutos(inicio, duracion), recordadaEn: null },
      });
      if (nueva.estado === 'confirmada') await programarAviso(nueva.id, nueva.inicio);
      else await cancelarAviso(nueva.id);
      onListo();
    } catch (e) {
      setError(
        e instanceof ErrorSolape || (e instanceof Error && e.name === 'ErrorSolape')
          ? 'Ese horario se cruza con otra cita. Elige otra hora.'
          : 'No se pudo reprogramar. Intenta de nuevo.',
      );
      setGuardando(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).reduceMotion(ReduceMotion.System)}
      exiting={FadeOutUp.duration(160).reduceMotion(ReduceMotion.System)}
      className="gap-4 overflow-hidden rounded-tile border border-line bg-surface p-4">
      <Text variant="heading">Nuevo horario</Text>
      <SelectorHorario
        dias={dias}
        hoy={hoy}
        fecha={fecha}
        onFecha={(f) => {
          setFecha(f);
          setError(null);
        }}
        hora={hora}
        onHora={(h) => {
          setHora(h);
          setError(null);
        }}
        todas={todas}
        onTodas={setTodas}
        datos={datos}
      />
      {error ? (
        <Text variant="label" className="text-danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        <Button label="Volver" variant="ghost" onPress={onCerrar} className="flex-1" />
        <Button label="Mover cita" onPress={guardar} loading={guardando} disabled={!horaLista} className="flex-1" />
      </View>
    </Animated.View>
  );
}
