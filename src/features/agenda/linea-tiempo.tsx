import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

import { CitaBloque } from './cita-bloque';
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
const MEDIANIL = 52;

type Props = {
  ventana: Rango;
  huecos: { ini: number; estado: EstadoHueco }[];
  bloqueos: BloqueoDia[];
  citas: CitaEnDia[];
  /** Minuto actual si el día mostrado es hoy. */
  ahoraMin: number | null;
  onHueco: (ini: number) => void;
  onCita: (id: string) => void;
};

/** Posición vertical (px) de un minuto del día dentro de la línea de tiempo. */
export const yDeMinuto = (ventana: Rango, min: number) => MARGEN + (min - ventana.ini) * PX_MIN;

/**
 * Línea de tiempo vertical del día: horas en Geist Mono, cuadrícula de 30 min, horas fuera de la
 * disponibilidad sombreadas, bloqueos con su motivo y un hueco tocable por cada media hora libre.
 */
export function LineaDeTiempo({ ventana, huecos, bloqueos, citas, ahoraMin, onHueco, onCita }: Props) {
  const y = (min: number) => yDeMinuto(ventana, min);
  const altoTotal = y(ventana.fin) + MARGEN;

  const marcas: number[] = [];
  for (let m = ventana.ini; m <= ventana.fin; m += PASO_MIN) marcas.push(m);

  const fuera = agruparHuecos(huecos, 'fuera');
  const libres = huecos.filter((h) => h.estado === 'libre');
  const primerLibre = libres[0]?.ini;
  const bloques = distribuirColumnas(citas);

  return (
    <View style={[styles.root, { height: altoTotal }]}>
      <View style={styles.medianil}>
        {marcas
          .filter((m) => m % 60 === 0)
          .map((m) => (
            <Text key={m} variant="mono" tone={color.inkSoft} style={[styles.hora, { top: y(m) - 8 }]}>
              {aHora(m)}
            </Text>
          ))}
      </View>

      <View style={styles.carril}>
        {fuera.map((r) => (
          <View
            key={`f${r.ini}`}
            style={[styles.fuera, { top: y(r.ini), height: (r.fin - r.ini) * PX_MIN }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ))}

        {marcas.map((m) => (
          <View key={`l${m}`} style={[m % 60 === 0 ? styles.lineaHora : styles.lineaMedia, { top: y(m) }]} />
        ))}

        {bloqueos.map((b) => {
          const ini = Math.max(b.ini, ventana.ini);
          const fin = Math.min(b.fin, ventana.fin);
          if (fin <= ini) return null;
          const alto = (fin - ini) * PX_MIN;
          return (
            <View
              key={b.id}
              style={[styles.bloqueo, { top: y(ini) + 1, height: alto - 2 }]}
              accessible
              accessibilityLabel={`Bloqueado de ${aHora(b.ini)} a ${aHora(b.fin)}${b.motivo ? `, ${b.motivo}` : ''}`}>
              {alto >= 30 ? (
                <Text variant="caption" tone={color.inkSoft} numberOfLines={1}>
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
            onPress={() => onHueco(h.ini)}
            style={[styles.hueco, { top: y(h.ini) }]}>
            {({ pressed }) =>
              pressed || h.ini === primerLibre ? (
                <View style={[styles.fantasma, pressed && styles.fantasmaActivo]}>
                  <PlusIcon size={14} color={pressed ? color.accent : color.inkSoft} />
                  <Text variant="label" tone={pressed ? color.accent : color.inkSoft}>
                    Agendar a las {aHora(h.ini)}
                  </Text>
                </View>
              ) : null
            }
          </Pressable>
        ))}

        {bloques.map((b) => {
          const ini = Math.max(b.ini, ventana.ini);
          const fin = Math.min(b.fin, ventana.fin);
          const alto = Math.max(ALTO_HUECO, (fin - ini) * PX_MIN) - 2;
          return (
            <View
              key={b.cita.id}
              style={[
                styles.bloque,
                { top: y(ini) + 1, height: alto, left: `${(b.col / b.cols) * 100}%`, width: `${100 / b.cols}%` },
              ]}>
              <CitaBloque cita={b.cita} alto={alto} onPress={() => onCita(b.cita.id)} />
            </View>
          );
        })}

        {ahoraMin !== null && ahoraMin >= ventana.ini && ahoraMin <= ventana.fin ? (
          <View
            pointerEvents="none"
            style={[styles.ahora, { top: y(ahoraMin) - 1 }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants">
            <View style={styles.ahoraPunto} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row' },
  medianil: { width: MEDIANIL },
  hora: { position: 'absolute', left: 0 },
  carril: { flex: 1 },
  fuera: { position: 'absolute', left: 0, right: 0, backgroundColor: color.quiet },
  lineaHora: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: color.line },
  lineaMedia: { position: 'absolute', left: space.md, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: color.line },
  bloqueo: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: radius.field,
    backgroundColor: color.quiet,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  hueco: { position: 'absolute', left: 0, right: 0, height: ALTO_HUECO, padding: 3 },
  fantasma: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderRadius: radius.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.inkSoft,
  },
  fantasmaActivo: { borderColor: color.accent, backgroundColor: color.surface },
  bloque: { position: 'absolute', paddingHorizontal: 1 },
  ahora: { position: 'absolute', left: -6, right: 0, height: 2, backgroundColor: color.accent, justifyContent: 'center' },
  ahoraPunto: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: color.accent, marginLeft: -4 },
});
