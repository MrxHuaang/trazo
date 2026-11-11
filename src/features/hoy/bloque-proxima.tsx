import { View } from 'react-native';

import type { CitaConPaciente } from '@/domain/types';
import { horaTexto } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { color, tile } from '@/theme';
import { SolidarioMark, Text, Tile } from '@/ui';

import { AnilloCuenta } from './anillo-cuenta';
import { cuentaRegresiva, etiquetaProxima } from './rules';

type BloqueProximaProps = {
  cita?: CitaConPaciente;
  ahoraMs: number;
  cargando: boolean;
  onAbrir: (citaId: string) => void;
};

/**
 * Bloque de la próxima cita: hora grande y un anillo que se vacía según falta.
 * Cuando faltan 10 minutos o menos pasa de lavanda a cobalto con texto blanco: es hora de prepararse.
 */
export function BloqueProxima({ cita, ahoraMs, cargando, onAbrir }: BloqueProximaProps) {
  if (!cita) {
    return (
      <Tile tone="consulta">
        <Text variant="bodyMedium" className="text-lavanda-ink">
          {cargando ? 'Cargando citas' : 'No hay más citas hoy'}
        </Text>
      </Tile>
    );
  }

  const cuenta = cuentaRegresiva(cita, ahoraMs);
  const texto = cuenta.inminente ? 'text-accent-on' : 'text-lavanda-ink';
  const etiqueta = etiquetaProxima(cita, ahoraMs);

  return (
    <Tile
      tone="consulta"
      contentClassName={cn('flex-row items-center justify-between gap-3', cuenta.inminente && 'bg-accent')}
      onPress={() => onAbrir(cita.id)}
      accessibilityLabel={`${etiqueta}. ${horaTexto(cita.inicio)}, ${cita.paciente.nombre}, ${cita.modalidad}${cita.esSolidaria ? ', cupo solidario' : ''}`}>
      <View className="flex-1">
        <Text variant="label" className={texto}>
          {etiqueta}
        </Text>
        <Text variant="number" className={cn('my-0.5', texto)}>
          {horaTexto(cita.inicio)}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text variant="bodyMedium" className={cn('shrink', texto)} numberOfLines={1}>
            {cita.paciente.nombre} · {cita.modalidad}
          </Text>
          {cita.esSolidaria ? <SolidarioMark /> : null}
        </View>
      </View>
      <AnilloCuenta progreso={cuenta.progreso} color={cuenta.inminente ? color.onAccent : tile.consulta.fg}>
        <Text variant="heading" className={texto}>
          {cuenta.cifra}
        </Text>
        <Text variant="caption" className={cn('-mt-1', texto)}>
          {cuenta.unidad}
        </Text>
      </AnilloCuenta>
    </Tile>
  );
}
