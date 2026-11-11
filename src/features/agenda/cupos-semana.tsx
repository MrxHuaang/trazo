import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { tile } from '@/theme';
import { HatchOverlay, NumeroAnimado, Text } from '@/ui';

type Props = { usados: number; total: number };

/** Contador por segmentos (sin barra de progreso): cada cupo usado lleva el durazno con textura. */
export function CuposSemana({ usados, total }: Props) {
  const segmentos = Math.min(Math.max(total, usados), 10);
  const excedido = usados > total;

  return (
    <View
      className="flex-row items-center gap-2"
      accessible
      accessibilityLabel={`${usados} de ${total} cupos solidarios esta semana${excedido ? ', por encima de lo previsto' : ''}`}>
      <View className="flex-row gap-[3px]">
        {Array.from({ length: segmentos }, (_, i) => {
          const usado = i < usados;
          return (
            <View
              key={i}
              className={cn(
                'h-2.5 w-3.5 overflow-hidden rounded-[3px] border',
                i >= total ? 'border-danger' : 'border-durazno-ink',
                usado && 'bg-durazno',
              )}>
              {usado ? <HatchOverlay color={tile.solidario.fg} opacity={0.35} gap={4} /> : null}
            </View>
          );
        })}
      </View>
      <View className="shrink flex-row items-baseline">
        <NumeroAnimado valor={usados} variant="label" className="text-durazno-ink" duracionMs={400} />
        <Text variant="label" className="shrink text-durazno-ink" numberOfLines={1}>
          {' '}
          de {total} cupos solidarios esta semana
        </Text>
      </View>
    </View>
  );
}
