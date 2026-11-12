import { router } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { fechaCorta, fechaLarga, horaTexto } from '@/lib/dates';
import { color } from '@/theme';
import { NumeroAnimado, Presionable, Text, Tile } from '@/ui';

import type { JornadaConInscritos } from '../repo';
import { capitalizar, etiquetaTipo } from '../rules';

type JornadaTileProps = {
  jornada: JornadaConInscritos;
  className?: string;
};

/** Bloque menta de una jornada: fecha, título, lugar e inscritos de cupos. Abre la jornada. */
export function JornadaTile({ jornada: j, className }: JornadaTileProps) {
  return (
    <Tile
      tone="confirmar"
      className={className}
      contentClassName="gap-1"
      onPress={() => router.push({ pathname: '/jornada/[id]', params: { id: j.id } })}
      accessibilityLabel={`${etiquetaTipo(j.tipo)}: ${j.titulo}. ${fechaLarga(j.inicio)} a las ${horaTexto(j.inicio)}, ${j.lugar}. ${j.inscritos} de ${j.cupos} inscritos.`}>
      <Text variant="label" className="text-menta-ink">
        {capitalizar(fechaCorta(j.inicio))} · {horaTexto(j.inicio)}
      </Text>
      <Text variant="bodyMedium" className="text-menta-ink" numberOfLines={2}>
        {j.titulo}
      </Text>
      <Text variant="caption" className="text-menta-ink" numberOfLines={1}>
        {etiquetaTipo(j.tipo)} · {j.lugar}
      </Text>
      <View className="mt-2 flex-row items-baseline gap-1">
        <NumeroAnimado valor={j.inscritos} variant="title" className="text-menta-ink" />
        <Text variant="label" className="text-menta-ink">
          de {j.cupos} inscritos
        </Text>
      </View>
    </Tile>
  );
}

type TarjetaFantasmaProps = {
  label: string;
  detalle?: string;
  onPress: () => void;
  className?: string;
  /** Alto mínimo menor para usarla dentro de formularios. */
  compacta?: boolean;
};

/** Tarjeta punteada para crear en contexto, en el lugar donde aparecerá lo creado. */
export function TarjetaFantasma({ label, detalle, onPress, className, compacta }: TarjetaFantasmaProps) {
  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={detalle}
      onPress={onPress}
      className={className}
      contentClassName={cn(
        'grow items-center justify-center gap-1 rounded-tile border border-dashed border-ink-soft p-4',
        compacta ? 'min-h-[72px]' : 'min-h-[132px]',
      )}>
      <PlusIcon size={22} color={color.accent} />
      <Text variant="bodyMedium" className="text-center text-accent">
        {label}
      </Text>
      {detalle ? (
        <Text variant="caption" className="text-center text-ink-soft">
          {detalle}
        </Text>
      ) : null}
    </Presionable>
  );
}
