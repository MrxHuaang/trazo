import { router } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { fechaCorta, fechaLarga, horaTexto } from '@/lib/dates';
import { color, radius, space, tile } from '@/theme';
import { Text, Tile } from '@/ui';

import type { JornadaConInscritos } from '../repo';
import { capitalizar, etiquetaTipo } from '../rules';

type JornadaTileProps = {
  jornada: JornadaConInscritos;
  style?: StyleProp<ViewStyle>;
};

/** Bloque menta de una jornada: fecha, título, lugar e inscritos de cupos. Abre la jornada. */
export function JornadaTile({ jornada: j, style }: JornadaTileProps) {
  const fg = tile.confirmar.fg;
  return (
    <Tile
      tone="confirmar"
      style={style}
      contentStyle={styles.contenido}
      onPress={() => router.push({ pathname: '/jornada/[id]', params: { id: j.id } })}
      accessibilityLabel={`${etiquetaTipo(j.tipo)}: ${j.titulo}. ${fechaLarga(j.inicio)} a las ${horaTexto(j.inicio)}, ${j.lugar}. ${j.inscritos} de ${j.cupos} inscritos.`}>
      <Text variant="label" tone={fg}>
        {capitalizar(fechaCorta(j.inicio))} · {horaTexto(j.inicio)}
      </Text>
      <Text variant="bodyMedium" tone={fg} numberOfLines={2}>
        {j.titulo}
      </Text>
      <Text variant="caption" tone={fg} numberOfLines={1}>
        {etiquetaTipo(j.tipo)} · {j.lugar}
      </Text>
      <View style={styles.cupos}>
        <Text variant="heading" tone={fg}>
          {j.inscritos} de {j.cupos}
        </Text>
        <Text variant="caption" tone={fg}>
          inscritos
        </Text>
      </View>
    </Tile>
  );
}

type TarjetaFantasmaProps = {
  label: string;
  detalle?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Tarjeta punteada para crear en contexto, en el lugar donde aparecerá lo creado. */
export function TarjetaFantasma({ label, detalle, onPress, style }: TarjetaFantasmaProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={detalle}
      onPress={onPress}
      style={({ pressed }) => [styles.fantasma, pressed && styles.pressed, style]}>
      <PlusIcon size={22} color={color.accent} />
      <Text variant="bodyMedium" tone={color.accent} style={styles.centro}>
        {label}
      </Text>
      {detalle ? (
        <Text variant="caption" tone={color.inkSoft} style={styles.centro}>
          {detalle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenido: { gap: 4 },
  cupos: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs, marginTop: space.sm },
  fantasma: {
    minHeight: 132,
    borderRadius: radius.tile,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: color.inkSoft,
    padding: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  centro: { textAlign: 'center' },
  pressed: { opacity: 0.6 },
});
