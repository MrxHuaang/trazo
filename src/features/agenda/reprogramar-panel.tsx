import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useActualizarCita } from '@/data/hooks';
import { ErrorSolape, type CitaConPaciente } from '@/domain/types';
import { fechaClave, isoDesde, sumarMinutos } from '@/lib/dates';
import { color, radius, space } from '@/theme';
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
    <View style={styles.panel}>
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
        <Text variant="label" tone={color.danger} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View style={styles.acciones}>
        <Button label="Volver" variant="ghost" onPress={onCerrar} style={styles.accion} />
        <Button label="Mover cita" onPress={guardar} loading={guardando} disabled={!horaLista} style={styles.accion} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    overflow: 'hidden',
  },
  acciones: { flexDirection: 'row', gap: space.sm },
  accion: { flex: 1 },
});
