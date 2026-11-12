import { View } from 'react-native';

import type { CitaConPaciente } from '@/domain/types';
import { cn } from '@/lib/cn';
import { horaTexto } from '@/lib/dates';
import { tile } from '@/theme';
import { HatchOverlay, Presionable, SolidarioMark, Text } from '@/ui';

import { ETIQUETA_ESTADO, ETIQUETA_MODALIDAD, esActiva, rangoHoras } from './rules';

type Props = {
  cita: CitaConPaciente;
  /** Alto disponible en px: decide cuántas líneas caben. */
  alto: number;
  onPress: () => void;
};

/**
 * Bloque de una cita en la línea de tiempo. El tipo se lee por color y por texto:
 * consulta en lavanda, solidaria en durazno con textura, solicitada con borde punteado cobalto,
 * asistió atenuada y no asistió con borde de error.
 */
export function CitaBloque({ cita, alto, onPress }: Props) {
  const solicitada = cita.estado === 'solicitada';
  const compacto = alto < 56;
  const tinta = solicitada ? 'text-accent' : cita.esSolidaria ? 'text-durazno-ink' : 'text-lavanda-ink';

  const etiqueta = `${rangoHoras(cita)}, ${cita.paciente.nombre}, ${ETIQUETA_MODALIDAD[cita.modalidad].toLowerCase()}, ${ETIQUETA_ESTADO[cita.estado].toLowerCase()}${cita.esSolidaria ? ', cupo solidario' : ''}`;
  const detalle = cita.esSolidaria
    ? `${ETIQUETA_MODALIDAD[cita.modalidad].toLowerCase()} · solidaria`
    : ETIQUETA_MODALIDAD[cita.modalidad].toLowerCase();

  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={esActiva(cita) ? 'Toca para abrirla. Mantén presionada y arrastra para cambiarle la hora.' : 'Abre el detalle de la cita'}
      onPress={onPress}
      hundir={0.98}
      className="flex-1"
      contentClassName={cn(
        'flex-1 gap-px overflow-hidden rounded-field px-3 py-1.5',
        solicitada ? 'border-[1.5px] border-dashed border-accent bg-surface' : cita.esSolidaria ? 'bg-durazno' : 'bg-lavanda',
        cita.estado === 'no_asistio' && 'border-[1.5px] border-danger',
        cita.estado === 'asistio' && 'opacity-60',
      )}>
      {cita.esSolidaria && !solicitada ? <HatchOverlay color={tile.solidario.fg} /> : null}
      <View className="flex-row items-center gap-2">
        <Text variant="mono" className={tinta}>
          {horaTexto(cita.inicio)}
        </Text>
        {compacto ? (
          <Text variant="bodyMedium" className={cn('flex-1', tinta)} numberOfLines={1}>
            {solicitada ? `Solicitada · ${cita.paciente.nombre}` : cita.paciente.nombre}
          </Text>
        ) : (
          <View className="flex-1" />
        )}
        {solicitada && cita.esSolidaria ? <SolidarioMark /> : null}
        {cita.estado === 'no_asistio' ? (
          <View className="rounded-full bg-danger-bg px-2">
            <Text variant="caption" className="text-danger">
              No asistió
            </Text>
          </View>
        ) : cita.estado === 'asistio' ? (
          <Text variant="caption" className={tinta}>
            Asistió
          </Text>
        ) : solicitada && !compacto ? (
          <Text variant="caption" className={tinta}>
            Solicitada
          </Text>
        ) : null}
      </View>
      {compacto ? null : (
        <>
          <Text variant="bodyMedium" className={tinta} numberOfLines={1}>
            {cita.paciente.nombre}
          </Text>
          {alto >= 68 ? (
            <Text variant="caption" className={tinta} numberOfLines={1}>
              {detalle}
            </Text>
          ) : null}
        </>
      )}
    </Presionable>
  );
}
