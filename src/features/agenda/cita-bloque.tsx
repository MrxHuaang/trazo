import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { CitaConPaciente } from '@/domain/types';
import { horaTexto } from '@/lib/dates';
import { color, radius, space, tile } from '@/theme';
import { HatchOverlay, SolidarioMark, Text } from '@/ui';

import { ETIQUETA_ESTADO, ETIQUETA_MODALIDAD, rangoHoras } from './rules';

type Props = {
  cita: CitaConPaciente;
  /** Alto disponible en px: decide cuántas líneas caben. */
  alto: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Bloque de una cita en la línea de tiempo. El tipo se lee por color y por texto:
 * consulta en lavanda, solidaria en durazno con textura, solicitada con borde punteado cobalto,
 * asistió atenuada y no asistió con borde de error.
 */
export function CitaBloque({ cita, alto, onPress, style }: Props) {
  const solicitada = cita.estado === 'solicitada';
  const tono = cita.esSolidaria ? tile.solidario : tile.consulta;
  const fg = solicitada ? color.accent : tono.fg;
  const compacto = alto < 56;

  const etiqueta = `${rangoHoras(cita)}, ${cita.paciente.nombre}, ${ETIQUETA_MODALIDAD[cita.modalidad].toLowerCase()}, ${ETIQUETA_ESTADO[cita.estado].toLowerCase()}${cita.esSolidaria ? ', cupo solidario' : ''}`;

  const detalle = [
    ETIQUETA_MODALIDAD[cita.modalidad].toLowerCase(),
    cita.esSolidaria ? 'solidaria' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint="Abre el detalle de la cita"
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: solicitada ? color.surface : tono.bg },
        solicitada && styles.solicitada,
        cita.estado === 'no_asistio' && styles.noAsistio,
        cita.estado === 'asistio' && styles.atenuada,
        pressed && styles.pressed,
        style,
      ]}>
      {cita.esSolidaria && !solicitada ? <HatchOverlay color={tile.solidario.fg} /> : null}
      <View style={styles.fila}>
        <Text variant="mono" tone={fg}>
          {horaTexto(cita.inicio)}
        </Text>
        {compacto ? (
          <Text variant="bodyMedium" tone={fg} numberOfLines={1} style={styles.flex}>
            {solicitada ? `Solicitada · ${cita.paciente.nombre}` : cita.paciente.nombre}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        {solicitada && cita.esSolidaria ? <SolidarioMark /> : null}
        {cita.estado === 'no_asistio' ? (
          <View style={styles.insignia}>
            <Text variant="caption" tone={color.danger}>
              No asistió
            </Text>
          </View>
        ) : cita.estado === 'asistio' ? (
          <Text variant="caption" tone={fg}>
            Asistió
          </Text>
        ) : solicitada && !compacto ? (
          <Text variant="caption" tone={fg}>
            Solicitada
          </Text>
        ) : null}
      </View>
      {compacto ? null : (
        <>
          <Text variant="bodyMedium" tone={fg} numberOfLines={1}>
            {cita.paciente.nombre}
          </Text>
          {alto >= 68 ? (
            <Text variant="caption" tone={fg} numberOfLines={1}>
              {detalle}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    borderRadius: radius.field,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    overflow: 'hidden',
    gap: 1,
  },
  solicitada: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.accent },
  noAsistio: { borderWidth: 1.5, borderColor: color.danger },
  atenuada: { opacity: 0.6 },
  pressed: { transform: [{ scale: 0.98 }] },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  insignia: { backgroundColor: color.dangerBg, borderRadius: radius.pill, paddingHorizontal: space.sm },
});
