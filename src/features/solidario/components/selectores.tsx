import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { fechaLarga, isoDesde, numeroDia } from '@/lib/dates';
import { color, radius, space } from '@/theme';
import { Text } from '@/ui';

import { capitalizar, diaCorto, diaMes } from '../rules';

const ANCHO_DIA = 58;
const ANCHO_HORA = 72;
const GAP = space.sm;

/** Desplazamiento inicial para que la opción elegida quede a la vista (con una antes). */
const desplazamiento = (indice: number, ancho: number) => ({ x: Math.max(indice - 1, 0) * (ancho + GAP), y: 0 });

type SelectorDiaProps = {
  label: string;
  /** Fechas 'yyyy-MM-dd' en orden. */
  dias: string[];
  valor: string;
  hoy: string;
  onChange: (dia: string) => void;
};

/** Fila deslizable de días (hoy y los siguientes) con la fecha completa debajo. */
export function SelectorDia({ label, dias, valor, hoy, onChange }: SelectorDiaProps) {
  const indice = Math.max(dias.indexOf(valor), 0);
  return (
    <View style={styles.bloque}>
      <Text variant="label">{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sangria}
        contentContainerStyle={styles.fila}
        contentOffset={desplazamiento(indice, ANCHO_DIA)}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}>
        {dias.map((d) => {
          const activo = d === valor;
          const primeroDelMes = d.endsWith('-01');
          return (
            <Pressable
              key={d}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={capitalizar(fechaLarga(isoDesde(d)))}
              onPress={() => {
                if (!activo) void Haptics.selectionAsync();
                onChange(d);
              }}
              style={[styles.dia, activo && styles.activo]}>
              <Text variant="caption" tone={activo ? color.onAccent : color.inkSoft}>
                {d === hoy ? 'hoy' : primeroDelMes ? diaMes(d).split(' ')[1] : diaCorto(d)}
              </Text>
              <Text variant="heading" tone={activo ? color.onAccent : color.ink}>
                {numeroDia(d)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text variant="caption" tone={color.inkSoft}>
        {capitalizar(fechaLarga(isoDesde(valor)))}
      </Text>
    </View>
  );
}

type SelectorHoraProps = {
  label: string;
  /** Horas 'HH:mm' en orden. */
  horas: string[];
  valor: string;
  onChange: (hora: string) => void;
};

/** Fila deslizable de horas cada 30 minutos. */
export function SelectorHora({ label, horas, valor, onChange }: SelectorHoraProps) {
  const indice = Math.max(horas.indexOf(valor), 0);
  return (
    <View style={styles.bloque}>
      <Text variant="label">{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sangria}
        contentContainerStyle={styles.fila}
        contentOffset={desplazamiento(indice, ANCHO_HORA)}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}>
        {horas.map((h) => {
          const activo = h === valor;
          return (
            <Pressable
              key={h}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={`${label} ${h}`}
              onPress={() => {
                if (!activo) void Haptics.selectionAsync();
                onChange(h);
              }}
              style={[styles.hora, activo && styles.activo]}>
              <Text variant="mono" tone={activo ? color.onAccent : color.ink}>
                {h}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: 6 },
  /** La fila se sale del margen de la hoja para deslizar de borde a borde. */
  sangria: { marginHorizontal: -space.xl },
  fila: { paddingHorizontal: space.xl, gap: GAP },
  dia: {
    width: ANCHO_DIA,
    minHeight: 60,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  hora: {
    width: ANCHO_HORA,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activo: { backgroundColor: color.ink, borderColor: color.ink },
});
