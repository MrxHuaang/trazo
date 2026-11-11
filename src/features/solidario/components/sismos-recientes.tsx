import { router } from 'expo-router';
import { ArrowClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowClockwise';
import { MapTrifoldIcon } from 'phosphor-react-native/src/icons/MapTrifold';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { color } from '@/theme';
import { Text, TraceLine } from '@/ui';

import type { Sismo } from '../api/sismo.mapper';
import { agitacionPorSismos, esFalloDeRed, formatoMagnitud, haceCuanto, sismoDeAviso, useSismos } from '../api/use-sismos';
import { Accion } from './accion';
import { Seccion } from './seccion';

const VISIBLES = 4;
const aparecer = FadeIn.duration(260).reduceMotion(ReduceMotion.System);

/**
 * Sismos recientes cerca de Pereira (catálogo público del USGS, vía axios + TanStack Query).
 * Si hubo uno de magnitud 4 o más en las últimas 48 horas, sugiere revisar los seguimientos.
 */
export function SismosRecientes() {
  const q = useSismos();
  // "Ahora" es el momento de la consulta: así el texto no cambia en cada render.
  const ahora = q.dataUpdatedAt || q.errorUpdatedAt;
  const sismos = q.data ?? [];
  const aviso = q.data ? sismoDeAviso(sismos, ahora) : null;

  return (
    <>
      <Seccion
        titulo="Sismos recientes cerca de Pereira"
        detalle="Magnitud 2,5 o más, a menos de 400 km."
        accion={
          sismos.length ? (
            <Accion
              label="Mapa"
              icon={MapTrifoldIcon}
              variante="texto"
              onPress={() => router.push('/mapa')}
              accessibilityLabel="Ver los sismos en el mapa"
            />
          ) : undefined
        }
      />

      {q.isPending ? (
        <View className="gap-2 py-2" accessibilityLabel="Consultando sismos recientes" accessibilityRole="progressbar">
          <TraceLine height={36} agitation={0.8} calmFrom={0.6} />
          <Text variant="caption" className="text-ink-soft">
            Consultando el registro de sismos…
          </Text>
        </View>
      ) : q.isError && !q.data ? (
        <SinDatos sinConexion={esFalloDeRed(q.error)} reintentando={q.isFetching} onReintentar={() => void q.refetch()} />
      ) : (
        <Animated.View entering={aparecer} className="gap-3">
          {aviso ? <Aviso sismo={aviso} ahora={ahora} /> : null}

          {sismos.length === 0 ? (
            <View className="gap-2 py-2">
              <TraceLine height={28} agitation={0.25} calmFrom={0.2} />
              <Text variant="body" className="text-ink-soft">
                No hay sismos registrados en la zona. La tierra está en calma.
              </Text>
            </View>
          ) : (
            <View>
              {sismos.slice(0, VISIBLES).map((s, i, arr) => (
                <FilaSismo key={s.id} sismo={s} ahora={ahora} last={i === arr.length - 1} />
              ))}
            </View>
          )}

          <Text variant="caption" className="text-ink-soft">
            Fuente: Servicio Geológico de los Estados Unidos (USGS).
            {q.isError ? ' No pudimos actualizar ahora; ves la última consulta.' : ''}
          </Text>
        </Animated.View>
      )}
    </>
  );
}

function FilaSismo({ sismo: s, ahora, last }: { sismo: Sismo; ahora: number; last: boolean }) {
  const fuerte = s.magnitud >= 4;
  return (
    <View
      className={cn('min-h-[56px] flex-row items-center gap-4 py-3', !last && 'border-b border-line')}
      accessible
      accessibilityLabel={`Magnitud ${formatoMagnitud(s.magnitud)}, ${s.lugar}, a ${s.distanciaKm} kilómetros de Pereira, ${haceCuanto(s.momento, ahora)}`}>
      <Text variant="title" className={cn('w-[52px]', fuerte ? 'text-ink' : 'text-ink-soft')}>
        {formatoMagnitud(s.magnitud)}
      </Text>
      <View className="flex-1 gap-0.5">
        <Text variant="bodyMedium" numberOfLines={1}>
          {s.lugar}
        </Text>
        <Text variant="caption" className="text-ink-soft">
          A unos {s.distanciaKm} km · {haceCuanto(s.momento, ahora)}
        </Text>
      </View>
    </View>
  );
}

/** Aviso tranquilo: no alarma, sugiere qué hacer. */
function Aviso({ sismo, ahora }: { sismo: Sismo; ahora: number }) {
  return (
    <View className="gap-3 rounded-tile bg-lavanda p-4">
      <TraceLine height={28} agitation={agitacionPorSismos([sismo])} calmFrom={0.5} stroke={color.ink} />
      <View className="gap-1">
        <Text variant="heading" className="text-lavanda-ink">
          Sismo de magnitud {formatoMagnitud(sismo.magnitud)} {haceCuanto(sismo.momento, ahora)}
        </Text>
        <Text variant="body" className="text-lavanda-ink">
          Puede aumentar la ansiedad: revisa tus seguimientos.
        </Text>
      </View>
      <Accion label="Ver seguimientos" onPress={() => router.push('/seguimientos')} className="self-start" />
    </View>
  );
}

type SinDatosProps = { sinConexion: boolean; reintentando: boolean; onReintentar: () => void };

function SinDatos({ sinConexion, reintentando, onReintentar }: SinDatosProps) {
  return (
    <View className="flex-row items-start gap-3 rounded-tile border border-line bg-surface p-4">
      {sinConexion ? <WifiSlashIcon size={22} color={color.inkSoft} /> : null}
      <View className="flex-1 gap-2">
        <Text variant="bodyMedium">{sinConexion ? 'Sin conexión' : 'No pudimos consultar los sismos'}</Text>
        <Text variant="caption" className="text-ink-soft">
          {sinConexion
            ? 'Los sismos llegan de internet. Lo demás de Trazo funciona sin conexión.'
            : 'El servicio no respondió. Intenta en unos minutos.'}
        </Text>
        <Accion
          label={reintentando ? 'Intentando…' : 'Intentar de nuevo'}
          icon={ArrowClockwiseIcon}
          onPress={onReintentar}
          disabled={reintentando}
          className="self-start"
        />
      </View>
    </View>
  );
}
