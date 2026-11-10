import { StyleSheet, View } from 'react-native';

import { useCitasEntre } from '@/data/hooks';
import { isoDesde, sumarDias } from '@/lib/dates';
import { color, space } from '@/theme';
import { Text } from '@/ui';

import { BotonTexto } from './boton-icono';
import { useBloqueosEntre, useDisponibilidad } from './hooks';
import {
  bloqueosDelDia,
  citasEnDia,
  fechaTitulo,
  franjasDelDia,
  horasParaCita,
  type FranjaDia,
  type OpcionHora,
} from './rules';
import { FechaChips, HoraChips } from './selectores';

type Entrada = {
  fecha: string;
  hora: string | null;
  duracion: number;
  ahoraMs: number;
  todas: boolean;
  /** Al reprogramar, la cita no choca consigo misma. */
  excluirCitaId?: string;
};

export type HorasDelDia = {
  horas: OpcionHora[];
  franjas: FranjaDia[];
  sinDisponibilidad: boolean;
  /** La hora elegida con su estado, o null si no está entre las opciones. */
  seleccion: OpcionHora | null;
  cargando: boolean;
};

/** Horas de inicio del día elegido según disponibilidad, bloqueos y citas activas (RN-01). */
export function useHorasDelDia({ fecha, hora, duracion, ahoraMs, todas, excluirCitaId }: Entrada): HorasDelDia {
  const desde = isoDesde(fecha);
  const hasta = isoDesde(sumarDias(fecha, 1));
  const dispQ = useDisponibilidad();
  const citasQ = useCitasEntre(desde, hasta);
  const bloqueosQ = useBloqueosEntre(desde, hasta);

  const todasLasFranjas = dispQ.data ?? [];
  const sinDisponibilidad = todasLasFranjas.length === 0;
  const franjas = franjasDelDia(todasLasFranjas, fecha);
  const base = {
    dia: fecha,
    franjas,
    sinDisponibilidad,
    bloqueos: bloqueosDelDia(bloqueosQ.data ?? [], fecha),
    citas: citasEnDia(citasQ.data ?? [], fecha),
    duracion,
    ahoraMs,
    excluirCitaId,
  };
  const propias = horasParaCita({ ...base, todas });
  // Una hora que llega de afuera (p. ej. el hueco tocado) se muestra aunque quede fuera del horario.
  const extra = hora && !propias.some((h) => h.hora === hora) ? horasParaCita({ ...base, todas: true }).filter((h) => h.hora === hora) : [];
  const horas = extra.length ? [...propias, ...extra].sort((a, b) => a.hora.localeCompare(b.hora)) : propias;

  return {
    horas,
    franjas,
    sinDisponibilidad,
    seleccion: (hora && horas.find((h) => h.hora === hora)) || null,
    cargando: dispQ.isPending || citasQ.isPending,
  };
}

type Props = {
  dias: string[];
  hoy: string;
  fecha: string;
  onFecha: (clave: string) => void;
  hora: string | null;
  onHora: (hora: string) => void;
  todas: boolean;
  onTodas: (v: boolean) => void;
  datos: HorasDelDia;
};

/** Fecha (tira de días) y hora (cuadrícula cada 30 min dentro de la disponibilidad). */
export function SelectorHorario({ dias, hoy, fecha, onFecha, hora, onHora, todas, onTodas, datos }: Props) {
  const { horas, franjas, sinDisponibilidad, seleccion, cargando } = datos;
  const libres = horas.filter((h) => h.estado === 'libre').length;

  let vacio: string | null = null;
  if (!cargando && libres === 0) {
    vacio = !todas && !sinDisponibilidad && franjas.length === 0
      ? 'No tienes disponibilidad este día.'
      : 'No quedan horas libres este día.';
  }

  return (
    <>
      <View style={styles.bloque}>
        <Text variant="label">Fecha · {fechaTitulo(fecha)}</Text>
        <FechaChips dias={dias} valor={fecha} onChange={onFecha} hoy={hoy} />
      </View>

      <View style={styles.bloque}>
        <Text variant="label">Hora</Text>
        {horas.length ? <HoraChips horas={horas} valor={hora} onChange={onHora} /> : null}
        {vacio ? (
          <Text variant="body" tone={color.inkSoft}>
            {vacio}
          </Text>
        ) : null}
        {seleccion && seleccion.estado !== 'libre' ? (
          <Text variant="caption" tone={color.danger}>
            {seleccion.estado === 'ocupada'
              ? 'Esa hora se cruza con otra cita. Elige otra.'
              : 'Esa hora está bloqueada. Elige otra.'}
          </Text>
        ) : null}
        {sinDisponibilidad ? (
          <Text variant="caption" tone={color.inkSoft}>
            Aún no defines tu horario: se muestran todas las horas.
          </Text>
        ) : (
          <View style={styles.fila}>
            <BotonTexto
              etiqueta={todas ? 'Ver solo mi horario' : 'Ver horas fuera de mi horario'}
              onPress={() => onTodas(!todas)}
            />
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: space.sm },
  fila: { flexDirection: 'row' },
});
