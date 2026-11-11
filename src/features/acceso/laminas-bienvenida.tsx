import { useRef, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Carousel, type CarouselRef } from 'react-native-reanimated-carousel';

import { color, type TileTone } from '@/theme';
import { Text, Tile } from '@/ui';

type Lamina = { tono: TileTone; texto: string; etiqueta: string; titulo: string; cuerpo: string };

/** Cada lámina usa el bloque de color de su tema: consulta, solidario (con textura) y confirmación. */
const LAMINAS: Lamina[] = [
  {
    tono: 'consulta',
    texto: 'text-lavanda-ink',
    etiqueta: 'Tu consultorio',
    titulo: 'El día, de un vistazo',
    cuerpo: 'Agenda, pacientes y cobros en bloques claros. Agendas tocando un hueco libre.',
  },
  {
    tono: 'solidario',
    texto: 'text-durazno-ink',
    etiqueta: 'Atención solidaria',
    titulo: 'Cupos para quien más lo necesita',
    cuerpo: 'Reserva cupos gratuitos o con tarifa social, y lleva jornadas y seguimientos.',
  },
  {
    tono: 'confirmar',
    texto: 'text-menta-ink',
    etiqueta: 'Privacidad',
    titulo: 'Tus datos se quedan aquí',
    cuerpo: 'Todo se guarda solo en este teléfono. No necesitas cuenta ni contraseña.',
  },
];

const ALTO = 184;

/** Tres láminas breves (react-native-reanimated-carousel) con indicador por segmentos. */
export function LaminasBienvenida() {
  const { width } = useWindowDimensions();
  const carrusel = useRef<CarouselRef>(null);
  const progreso = useSharedValue(0);
  const [actual, setActual] = useState(0);

  return (
    <View className="gap-1">
      {/* El carrusel necesita su propia raíz de gestos: el layout raíz no monta una. */}
      <GestureHandlerRootView style={{ width, height: ALTO }}>
        <Carousel
          ref={carrusel}
          style={{ width, height: ALTO }}
          data={LAMINAS}
          progress={progreso}
          onSnapToItem={setActual}
          keyExtractor={(lamina) => lamina.etiqueta}
          renderItem={({ item }) => (
            <View className="flex-1 px-5">
              <Tile tone={item.tono} className="flex-1" contentClassName="justify-between p-5">
                <Text variant="label" className={item.texto}>
                  {item.etiqueta}
                </Text>
                <View className="gap-1.5">
                  <Text variant="title" className={item.texto}>
                    {item.titulo}
                  </Text>
                  <Text variant="body" className={item.texto}>
                    {item.cuerpo}
                  </Text>
                </View>
              </Tile>
            </View>
          )}
        />
      </GestureHandlerRootView>

      <View className="flex-row items-center gap-1.5 px-5" accessibilityRole="tablist">
        {LAMINAS.map((lamina, indice) => (
          <Segmento
            key={lamina.etiqueta}
            indice={indice}
            progreso={progreso}
            activo={indice === actual}
            etiqueta={`Lámina ${indice + 1} de ${LAMINAS.length}: ${lamina.etiqueta}`}
            onPress={() => carrusel.current?.scrollTo({ index: indice, animated: true })}
          />
        ))}
      </View>
    </View>
  );
}

type SegmentoProps = {
  indice: number;
  progreso: SharedValue<number>;
  activo: boolean;
  etiqueta: string;
  onPress: () => void;
};

/** Segmento del indicador: se alarga y se oscurece a medida que su lámina se acerca. */
function Segmento({ indice, progreso, activo, etiqueta, onPress }: SegmentoProps) {
  const estilo = useAnimatedStyle(() => {
    const cerca = Math.max(0, 1 - Math.abs(progreso.get() - indice));
    return {
      width: 12 + cerca * 22,
      backgroundColor: interpolateColor(cerca, [0, 1], [color.line, color.ink]),
    };
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activo }}
      hitSlop={6}
      onPress={onPress}
      className="h-11 justify-center active:opacity-60">
      <Animated.View className="h-1.5 rounded-full" style={estilo} />
    </Pressable>
  );
}
