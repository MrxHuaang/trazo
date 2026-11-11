import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { NumeroAnimado, Text } from '@/ui';

import type { Asistencia, PuntoAsistencia } from './historia';

/** Cada estado tiene forma propia además del color: lleno, rombo, vacío. */
const FORMA: Record<PuntoAsistencia['tipo'], string> = {
  asistio: 'h-3 w-3 rounded-full bg-ink',
  falta: 'h-2.5 w-2.5 rotate-45 bg-danger',
  cancelada: 'h-3 w-3 rounded-full border-[1.5px] border-ink-soft',
  futura: 'h-3 w-3 rounded-full bg-accent',
  'sin-marcar': 'h-1.5 w-1.5 rounded-full bg-ink-soft',
};

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * "Asistencia de un vistazo": las últimas citas como una tira de puntos (la más reciente a la derecha)
 * y el porcentaje de asistencia. La tira es decorativa para el lector de pantalla; el resumen va en la etiqueta.
 */
export function AsistenciaTira({ asistencia }: { asistencia: Asistencia }) {
  const { puntos, asistidas, faltas, canceladas, futuras, porcentaje } = asistencia;
  if (puntos.length === 0) return null;

  const sinMarcar = puntos.some((p) => p.tipo === 'sin-marcar');
  const resumen = [
    porcentaje === null ? 'Aún sin citas cumplidas' : `Asistencia del ${porcentaje} por ciento`,
    `Últimas ${plural(puntos.length, 'cita', 'citas')}`,
    `asistió a ${asistidas}`,
    `faltó a ${faltas}`,
    plural(canceladas, 'cancelada', 'canceladas'),
    plural(futuras, 'por venir', 'por venir'),
  ].join(', ');

  return (
    <View className="gap-3 rounded-tile border border-line bg-surface p-4" accessible accessibilityLabel={resumen}>
      <View className="flex-row items-end justify-between gap-4">
        <View>
          <Text variant="label" className="text-ink-soft">
            Asistencia
          </Text>
          {porcentaje === null ? (
            <Text variant="heading">Sin citas cumplidas</Text>
          ) : (
            <NumeroAnimado valor={porcentaje} formato={(n) => `${Math.round(n)} %`} variant="number" />
          )}
        </View>
        <View className="shrink items-end gap-1.5">
          <View className="h-4 flex-row items-center gap-1.5">
            {puntos.map((p) => (
              <View key={p.id} className="h-3 w-3 items-center justify-center">
                <View className={FORMA[p.tipo]} />
              </View>
            ))}
          </View>
          <Text variant="caption" className="text-ink-soft">
            {porcentaje === null ? `Últimas ${puntos.length}` : `Asistió a ${asistidas} de ${asistidas + faltas}`}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Leyenda forma={FORMA.asistio} texto="Asistió" />
        <Leyenda forma={FORMA.falta} texto="No asistió" />
        <Leyenda forma={FORMA.cancelada} texto="Cancelada" />
        <Leyenda forma={FORMA.futura} texto="Por venir" />
        {sinMarcar ? <Leyenda forma={FORMA['sin-marcar']} texto="Sin marcar" /> : null}
      </View>
    </View>
  );
}

function Leyenda({ forma, texto }: { forma: string; texto: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-3 w-3 items-center justify-center">
        <View className={cn(forma)} />
      </View>
      <Text variant="caption" className="text-ink-soft">
        {texto}
      </Text>
    </View>
  );
}
