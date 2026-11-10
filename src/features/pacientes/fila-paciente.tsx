import * as Haptics from 'expo-haptics';
import { CalendarPlusIcon } from 'phosphor-react-native/src/icons/CalendarPlus';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { WhatsappLogoIcon } from 'phosphor-react-native/src/icons/WhatsappLogo';
import { useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import Swipeable, { SwipeDirection, type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Paciente } from '@/domain/types';
import { cn } from '@/lib/cn';
import { iniciales } from '@/lib/format';
import { color, tile } from '@/theme';
import { Presionable, SolidarioMark, Text } from '@/ui';

/** Desplazamiento a partir del cual, al soltar, se ejecuta la acción. */
const UMBRAL = 64;

const avisarUmbral = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

type FilaPacienteProps = {
  paciente: Paciente;
  /** "Próxima cita: lun 16 nov", "Última cita: …" o "Sin citas". */
  detalle: string;
  ultima: boolean;
  onAbrir: () => void;
  /** Deslizar a la derecha. Sin celular no se ofrece. */
  onWhatsApp?: () => void;
  /** Deslizar a la izquierda. */
  onAgendar?: () => void;
};

/**
 * Fila de paciente: tocar abre la ficha; deslizar a la derecha escribe por WhatsApp
 * y a la izquierda agenda. Las mismas acciones están en la ficha y como acciones de accesibilidad.
 */
export function FilaPaciente({ paciente: p, detalle, ultima, onAbrir, onWhatsApp, onAgendar }: FilaPacienteProps) {
  const deslizable = useRef<SwipeableMethods>(null);

  const acciones = [
    ...(onWhatsApp ? [{ name: 'whatsapp', label: 'Escribir por WhatsApp' }] : []),
    ...(onAgendar ? [{ name: 'agendar', label: 'Agendar cita' }] : []),
  ];

  return (
    <View className={cn(!ultima && 'border-b border-line')}>
      <Swipeable
        ref={deslizable}
        friction={1.4}
        overshootFriction={8}
        leftThreshold={UMBRAL}
        rightThreshold={UMBRAL}
        renderLeftActions={
          onWhatsApp
            ? (_progreso, traslacion) => (
                <AccionDeslizada
                  traslacion={traslacion}
                  etiqueta="WhatsApp"
                  className="bg-menta"
                  textoClassName="text-menta-ink"
                  icono={<WhatsappLogoIcon size={22} color={tile.confirmar.fg} />}
                />
              )
            : undefined
        }
        renderRightActions={
          onAgendar
            ? (_progreso, traslacion) => (
                <AccionDeslizada
                  traslacion={traslacion}
                  etiqueta="Agendar"
                  className="bg-lavanda"
                  textoClassName="text-lavanda-ink"
                  icono={<CalendarPlusIcon size={22} color={tile.consulta.fg} />}
                />
              )
            : undefined
        }
        onSwipeableOpen={(direccion) => {
          deslizable.current?.close();
          if (direccion === SwipeDirection.RIGHT) onWhatsApp?.();
          else onAgendar?.();
        }}>
        <Presionable
          accessibilityRole="button"
          accessibilityLabel={`${p.nombre}. ${detalle}${p.afectadoSismo ? '. Afectado por el sismo' : ''}`}
          accessibilityHint="Abre la ficha"
          accessibilityActions={acciones}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'whatsapp') onWhatsApp?.();
            if (e.nativeEvent.actionName === 'agendar') onAgendar?.();
          }}
          onPress={onAbrir}
          hundir={0.985}
          className="bg-canvas"
          contentClassName="min-h-[64px] flex-row items-center gap-3 py-3">
          <View className={cn('h-10 w-10 items-center justify-center rounded-full', p.archivadoEn ? 'bg-quiet' : 'bg-lavanda')}>
            <Text variant="label" className={p.archivadoEn ? 'text-ink-soft' : 'text-lavanda-ink'}>
              {iniciales(p.nombre)}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text variant="bodyMedium" numberOfLines={1} className="shrink">
                {p.nombre}
              </Text>
              {p.afectadoSismo ? <SolidarioMark /> : null}
            </View>
            <Text variant="caption" numberOfLines={1} className="text-ink-soft">
              {detalle}
            </Text>
          </View>
          <CaretRightIcon size={16} color={color.inkSoft} />
        </Presionable>
      </Swipeable>
    </View>
  );
}

/** Fondo que aparece bajo la fila al deslizar: el ícono crece hasta el umbral y avisa con un toque háptico. */
function AccionDeslizada({
  traslacion,
  etiqueta,
  icono,
  className,
  textoClassName,
}: {
  traslacion: SharedValue<number>;
  etiqueta: string;
  icono: ReactNode;
  className: string;
  textoClassName: string;
}) {
  useAnimatedReaction(
    () => Math.abs(traslacion.get()) >= UMBRAL,
    (cruzo, antes) => {
      if (cruzo && antes === false) scheduleOnRN(avisarUmbral);
    },
  );

  const contenido = useAnimatedStyle(() => {
    const avance = Math.abs(traslacion.get());
    return {
      opacity: interpolate(avance, [0, UMBRAL * 0.6], [0, 1], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(avance, [0, UMBRAL], [0.7, 1], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View className={cn('my-1 w-28 items-center justify-center rounded-tile', className)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View className="items-center gap-1" style={contenido}>
        {icono}
        <Text variant="label" className={textoClassName}>
          {etiqueta}
        </Text>
      </Animated.View>
    </View>
  );
}
