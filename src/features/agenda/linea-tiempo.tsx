import * as Haptics from 'expo-haptics';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  LayoutAnimationConfig,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { color } from '@/theme';
import { Text } from '@/ui';

import { CitaArrastrable } from './cita-arrastrable';
import {
  agruparHuecos,
  aHora,
  distribuirColumnas,
  PASO_MIN,
  type BloqueoDia,
  type CitaEnDia,
  type EstadoHueco,
  type Rango,
} from './rules';

/** 30 minutos = 44 px: cada hueco libre es un área táctil de al menos 44. */
export const ALTO_HUECO = 44;
const PX_MIN = ALTO_HUECO / PASO_MIN;
const MARGEN = 10;

type Props = {
  ventana: Rango;
  huecos: { ini: number; estado: EstadoHueco }[];
  bloqueos: BloqueoDia[];
  citas: CitaEnDia[];
  /** Minuto actual si el día mostrado es hoy. */
  ahoraMin: number | null;
  /** Hueco que se muestra con un pulso (p. ej. el próximo libre). */
  resaltado: number | null;
  scrollOffset: SharedValue<number>;
  dedoY: SharedValue<number>;
  onHueco: (ini: number) => void;
  onCita: (id: string) => void;
  onArrastre: (activo: boolean) => void;
  /** Mueve la cita a un nuevo minuto de inicio. Resuelve false si no se pudo. */
  onMover: (bloque: CitaEnDia, nuevoIni: number) => Promise<boolean>;
};

/** Posición vertical (px) de un minuto del día dentro de la línea de tiempo. */
export const yDeMinuto = (ventana: Rango, min: number) => MARGEN + (min - ventana.ini) * PX_MIN;

/**
 * Línea de tiempo vertical del día: horas en Geist Mono, cuadrícula de 30 min, horas fuera de la
 * disponibilidad sombreadas, bloqueos con su motivo, un hueco tocable por cada media hora libre
 * y las citas, que se pueden arrastrar para cambiarles la hora.
 */
export function LineaDeTiempo({
  ventana,
  huecos,
  bloqueos,
  citas,
  ahoraMin,
  resaltado,
  scrollOffset,
  dedoY,
  onHueco,
  onCita,
  onArrastre,
  onMover,
}: Props) {
  const y = (min: number) => yDeMinuto(ventana, min);
  const altoTotal = y(ventana.fin) + MARGEN;

  const marcas: number[] = [];
  for (let m = ventana.ini; m <= ventana.fin; m += PASO_MIN) marcas.push(m);

  const fuera = agruparHuecos(huecos, 'fuera');
  const libres = huecos.filter((h) => h.estado === 'libre');
  const primerLibre = libres[0]?.ini;
  const bloques = distribuirColumnas(citas);

  return (
    <View className="flex-row" style={{ height: altoTotal }}>
      <View className="w-[52px]">
        {marcas
          .filter((m) => m % 60 === 0)
          .map((m) => (
            <Text key={m} variant="mono" className="absolute left-0 text-ink-soft" style={{ top: y(m) - 8 }}>
              {aHora(m)}
            </Text>
          ))}
      </View>

      <View className="flex-1">
        {fuera.map((r) => (
          <View
            key={`f${r.ini}`}
            className="absolute left-0 right-0 bg-quiet"
            style={{ top: y(r.ini), height: (r.fin - r.ini) * PX_MIN }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ))}

        {marcas.map((m) => (
          <View
            key={`l${m}`}
            className={cn('absolute right-0 h-px bg-line', m % 60 === 0 ? 'left-0' : 'left-3 opacity-50')}
            style={{ top: y(m) }}
          />
        ))}

        {bloqueos.map((b) => {
          const ini = Math.max(b.ini, ventana.ini);
          const fin = Math.min(b.fin, ventana.fin);
          if (fin <= ini) return null;
          const alto = (fin - ini) * PX_MIN;
          return (
            <View
              key={b.id}
              className="absolute left-0.5 right-0.5 overflow-hidden rounded-field border border-line bg-quiet px-3 py-1.5"
              style={{ top: y(ini) + 1, height: alto - 2 }}
              accessible
              accessibilityLabel={`Bloqueado de ${aHora(b.ini)} a ${aHora(b.fin)}${b.motivo ? `, ${b.motivo}` : ''}`}>
              {alto >= 30 ? (
                <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
                  {b.motivo ? `Bloqueado · ${b.motivo}` : 'Bloqueado'}
                </Text>
              ) : null}
            </View>
          );
        })}

        {libres.map((h) => (
          <Pressable
            key={`h${h.ini}`}
            accessibilityRole="button"
            accessibilityLabel={`Agendar a las ${aHora(h.ini)}`}
            onPress={() => {
              void Haptics.selectionAsync();
              onHueco(h.ini);
            }}
            className={cn(
              'absolute left-0 right-0 p-[3px] active:opacity-100',
              h.ini === primerLibre || h.ini === resaltado ? 'opacity-100' : 'opacity-0',
            )}
            style={{ top: y(h.ini), height: ALTO_HUECO }}>
            {h.ini === resaltado ? (
              <HuecoResaltado hora={aHora(h.ini)} />
            ) : (
              <View className="flex-1 flex-row items-center justify-center gap-1 rounded-field border border-dashed border-ink-soft">
                <PlusIcon size={14} color={color.inkSoft} />
                <Text variant="label" className="text-ink-soft">
                  Agendar a las {aHora(h.ini)}
                </Text>
              </View>
            )}
          </Pressable>
        ))}

        <LayoutAnimationConfig skipEntering skipExiting>
          {bloques.map((b) => {
            const ini = Math.max(b.ini, ventana.ini);
            const fin = Math.min(b.fin, ventana.fin);
            return (
              <CitaArrastrable
                key={b.cita.id}
                cita={b.cita}
                ini={b.ini}
                top={y(ini) + 1}
                alto={Math.max(ALTO_HUECO, (fin - ini) * PX_MIN) - 2}
                col={b.col}
                cols={b.cols}
                pxMin={PX_MIN}
                minMinutos={ventana.ini - b.ini}
                maxMinutos={ventana.fin - b.fin}
                scrollOffset={scrollOffset}
                dedoY={dedoY}
                onPress={() => onCita(b.cita.id)}
                onArrastre={onArrastre}
                onSoltar={(minutos) => onMover(b, b.ini + minutos)}
              />
            );
          })}
        </LayoutAnimationConfig>

        {ahoraMin !== null && ahoraMin >= ventana.ini && ahoraMin <= ventana.fin ? <LineaAhora top={y(ahoraMin) - 1} /> : null}
      </View>
    </View>
  );
}

/** Línea de "ahora": cobalto, con un punto que respira despacio para ubicar el momento sin alarmar. */
function LineaAhora({ top }: { top: number }) {
  const reducir = useReducedMotion();
  const pulso = useSharedValue(0);

  useEffect(() => {
    if (reducir) return;
    pulso.set(withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false));
  }, [reducir, pulso]);

  const halo = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulso.get()),
    transform: [{ scale: 1 + pulso.get() * 1.6 }],
  }));

  return (
    <View
      pointerEvents="none"
      className="absolute -left-1.5 right-0 h-0.5 justify-center bg-accent"
      style={{ top }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View className="-ml-1 h-2.5 w-2.5 items-center justify-center">
        <Animated.View className="absolute h-2.5 w-2.5 rounded-full bg-accent" style={halo} />
        <View className="h-2.5 w-2.5 rounded-full bg-accent" />
      </View>
    </View>
  );
}

/** Hueco señalado por "Próximo hueco libre": tres pulsos de cobalto y se queda quieto. */
function HuecoResaltado({ hora }: { hora: string }) {
  const reducir = useReducedMotion();
  const pulso = useSharedValue(0);

  useEffect(() => {
    if (reducir) return;
    pulso.set(
      withRepeat(withSequence(withTiming(1, { duration: 420 }), withTiming(0, { duration: 420 })), 3, false),
    );
  }, [reducir, pulso]);

  const fondo = useAnimatedStyle(() => ({ opacity: 0.25 + pulso.get() * 0.75 }));

  return (
    <View className="flex-1 flex-row items-center justify-center gap-1 overflow-hidden rounded-field border-[1.5px] border-accent">
      <Animated.View className="absolute bottom-0 left-0 right-0 top-0 bg-accent-soft" style={fondo} />
      <PlusIcon size={14} color={color.accent} />
      <Text variant="label" className="text-accent">
        Libre a las {hora}
      </Text>
    </View>
  );
}
