import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space, type } from '@/theme';
import { SolidarioMark, Text } from '@/ui';

import type { ItemHistoria, NodoHistoria } from './historia';
import { TrazoVertical } from './trazo-vertical';

/** Ancho de la columna del Trazo. */
const CANAL = 28;
const PADDING_ITEM = space.md;

type HistoriaLineaProps = {
  items: ItemHistoria[];
  onPressItem: (item: ItemHistoria) => void;
  onAbrirNota: (item: ItemHistoria) => void;
};

/** Historia vertical: el Trazo corre por la izquierda y cada evento es un punto sobre él. */
export function HistoriaLinea({ items, onPressItem, onAbrirNota }: HistoriaLineaProps) {
  const [alto, setAlto] = useState(0);

  return (
    <View onLayout={(e) => setAlto(Math.round(e.nativeEvent.layout.height))}>
      {alto > 0 ? <TrazoVertical alto={alto} ancho={CANAL} /> : null}
      {items.map((item) => (
        <FilaHistoria key={item.clave} item={item} onPress={onPressItem} onAbrirNota={onAbrirNota} />
      ))}
    </View>
  );
}

function FilaHistoria({
  item,
  onPress,
  onAbrirNota,
}: {
  item: ItemHistoria;
  onPress: (item: ItemHistoria) => void;
  onAbrirNota: (item: ItemHistoria) => void;
}) {
  const tocable = item.tipo === 'cita' || item.tipo === 'nota' || (item.tipo === 'seguimiento' && item.seguimientoEstado === 'pendiente');
  const pista =
    item.tipo === 'cita' ? 'Abre el detalle de la cita' : item.tipo === 'nota' ? 'Pide huella o código' : 'Marca el seguimiento';

  return (
    <View style={styles.fila}>
      <View style={styles.canal}>
        <Nodo tipo={item.nodo} />
      </View>
      <View style={styles.cuerpo}>
        <Pressable
          disabled={!tocable}
          onPress={() => onPress(item)}
          accessibilityRole={tocable ? 'button' : undefined}
          accessibilityLabel={`${item.titulo}. ${item.detalle}`}
          accessibilityHint={tocable ? pista : undefined}
          style={({ pressed }) => [styles.principal, pressed && styles.pressed]}>
          <View style={styles.tituloFila}>
            <Text variant="bodyMedium" style={styles.titulo}>
              {item.titulo}
            </Text>
            {item.solidaria ? <SolidarioMark /> : null}
          </View>
          <Text variant="caption" tone={color.inkSoft}>
            {item.detalle}
          </Text>
        </Pressable>
        {item.tipo === 'cita' && item.notaId ? (
          <Pressable
            onPress={() => onAbrirNota(item)}
            accessibilityRole="button"
            accessibilityLabel="Nota privada de esta sesión"
            accessibilityHint="Pide huella o código"
            hitSlop={{ top: 6, bottom: 6 }}
            style={({ pressed }) => [styles.nota, pressed && styles.pressed]}>
            <LockSimpleIcon size={14} color={color.ink} />
            <Text variant="label">Nota privada</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const TAM: Record<NodoHistoria, number> = {
  proxima: 14,
  agendada: 11,
  solicitada: 11,
  pendiente: 11,
  pasada: 8,
  falta: 10,
  cancelada: 9,
};

/** Punto del evento: cobalto la próxima cita, tinta lo agendado, vacío lo pendiente, gris lo pasado. */
function Nodo({ tipo }: { tipo: NodoHistoria }) {
  const tam = TAM[tipo];
  const relleno =
    tipo === 'proxima' ? color.accent : tipo === 'agendada' ? color.ink : tipo === 'pasada' ? color.inkSoft : color.canvas;
  const borde = tipo === 'falta' ? color.danger : tipo === 'cancelada' ? color.inkSoft : color.ink;
  const hueco = tipo === 'solicitada' || tipo === 'pendiente' || tipo === 'falta' || tipo === 'cancelada';
  return (
    <View style={styles.anillo}>
      <View
        style={{
          width: tam,
          height: tam,
          borderRadius: radius.pill,
          backgroundColor: relleno,
          borderWidth: hueco ? 1.5 : 0,
          borderColor: borde,
        }}
      />
    </View>
  );
}

/** Centro del punto alineado con la primera línea del título. */
const ANILLO = 20;

const styles = StyleSheet.create({
  fila: { flexDirection: 'row' },
  canal: { width: CANAL, alignItems: 'center', paddingTop: PADDING_ITEM + type.bodyMedium.lineHeight / 2 - ANILLO / 2 },
  anillo: {
    width: ANILLO,
    height: ANILLO,
    borderRadius: radius.pill,
    backgroundColor: color.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: { flex: 1, paddingLeft: space.sm },
  principal: { paddingVertical: PADDING_ITEM, gap: 2, minHeight: 44 },
  tituloFila: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  titulo: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
  nota: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    marginTop: -space.xs,
    marginBottom: PADDING_ITEM,
    paddingHorizontal: space.md,
    minHeight: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.ink,
  },
});
