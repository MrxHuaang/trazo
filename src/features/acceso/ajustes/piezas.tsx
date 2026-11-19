// Piezas que solo usa ajustes, por eso no viven en src/ui.
import * as Haptics from 'expo-haptics';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { color, type TextVariant } from '@/theme';
import { Aparecer, Button, Field, Presionable, Text } from '@/ui';

/** Mismo resorte que `Aparecer reacomodar` para que filas y secciones se muevan juntas. */
export const ACOMODO = LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System);
const ENTRA = FadeIn.duration(200).reduceMotion(ReduceMotion.System);
const SALE = FadeOut.duration(120).reduceMotion(ReduceMotion.System);
const DESPLIEGA = FadeInDown.duration(220).reduceMotion(ReduceMotion.System);

const DIVISOR = 'border-b border-line';

type SeccionProps = { titulo: string; nota?: string; orden: number; children: ReactNode };

export function Seccion({ titulo, nota, orden, children }: SeccionProps) {
  return (
    <Aparecer orden={orden} reacomodar className="mt-6 gap-1">
      <View className="mb-1 gap-0.5">
        <Text variant="heading" accessibilityRole="header">
          {titulo}
        </Text>
        {nota ? (
          <Text variant="caption" className="text-ink-soft">
            {nota}
          </Text>
        ) : null}
      </View>
      {/* La sección ya entra en cascada; sin skipEntering las filas animarían su entrada otra vez. */}
      <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
    </Aparecer>
  );
}

/** Para lo que tiene que correrse cuando una fila vecina crece. */
export function Acomodable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Animated.View layout={ACOMODO} className={className}>
      {children}
    </Animated.View>
  );
}

type ValorEditableProps = {
  etiqueta: string;
  /** Ya formateado. */
  valor: string;
  /** Lo que se muestra si no hay valor. */
  vacio?: string;
  variante?: TextVariant;
  abierto: boolean;
  onAbrir: () => void;
  ultimo?: boolean;
  editor: Omit<EditorEnLineaProps, 'etiqueta'>;
};

/** Al tocarla se convierte en un campo con Guardar y Cancelar, sin salir de la pantalla. */
export function ValorEditable({ etiqueta, valor, vacio, variante = 'bodyMedium', abierto, onAbrir, ultimo, editor }: ValorEditableProps) {
  const texto = valor || vacio || '';
  return (
    <Animated.View layout={ACOMODO} className={cn('overflow-hidden', !ultimo && DIVISOR)}>
      {abierto ? (
        <Animated.View key="editor" entering={ENTRA} className="py-3">
          <EditorEnLinea etiqueta={etiqueta} {...editor} />
        </Animated.View>
      ) : (
        <Animated.View key="valor" entering={ENTRA}>
          <Presionable
            accessibilityRole="button"
            accessibilityLabel={`${etiqueta}: ${texto}`}
            accessibilityHint="Toca para editar"
            onPress={onAbrir}
            hundir={0.985}
            contentClassName="min-h-[56px] flex-row items-center gap-3 py-3">
            <View className="flex-1 gap-0.5">
              <Text variant="caption" className="text-ink-soft">
                {etiqueta}
              </Text>
              <Text variant={variante} className={valor ? 'text-ink' : 'text-ink-soft'}>
                {texto}
              </Text>
            </View>
            <PencilSimpleIcon size={18} color={color.inkSoft} />
          </Presionable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

type EditorEnLineaProps = {
  etiqueta: string;
  inicial: string;
  /** Se aplica mientras se escribe, p. ej. puntos de miles. */
  formatear?: (texto: string) => string;
  /** Mensaje de error o null. */
  validar: (texto: string) => string | null;
  guardar: (texto: string) => Promise<unknown>;
  onCerrar: () => void;
  helper?: string;
  campo?: Omit<ComponentProps<typeof Field>, 'label' | 'value' | 'onChangeText' | 'error' | 'helper'>;
};

export function EditorEnLinea({ etiqueta, inicial, formatear, validar, guardar, onCerrar, helper, campo }: EditorEnLineaProps) {
  const [texto, setTexto] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const confirmar = async () => {
    const mensaje = validar(texto);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setGuardando(true);
    try {
      await guardar(texto);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCerrar();
    } catch {
      setError('No pudimos guardar el cambio. Intenta de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <View className="gap-2">
      <Field
        label={etiqueta}
        value={texto}
        onChangeText={(t) => {
          setTexto(formatear ? formatear(t) : t);
          if (error) setError(null);
        }}
        error={error ?? undefined}
        helper={helper}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => void confirmar()}
        {...campo}
      />
      <View className="flex-row justify-end gap-2">
        <Button label="Cancelar" variant="ghost" size="sm" onPress={onCerrar} />
        <Button label="Guardar" variant="accent" size="sm" loading={guardando} onPress={() => void confirmar()} />
      </View>
    </View>
  );
}

type FilaEnlaceProps = {
  icono: ReactNode;
  titulo: string;
  detalle?: string;
  marca?: ReactNode;
  onPress: () => void;
  ultimo?: boolean;
};

export function FilaEnlace({ icono, titulo, detalle, marca, onPress, ultimo }: FilaEnlaceProps) {
  return (
    <Animated.View layout={ACOMODO} className={cn(!ultimo && DIVISOR)}>
      <Presionable
        accessibilityRole="button"
        accessibilityLabel={detalle ? `${titulo}. ${detalle}` : titulo}
        onPress={onPress}
        hundir={0.985}
        contentClassName="min-h-[56px] flex-row items-center gap-3 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-quiet">{icono}</View>
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text variant="bodyMedium">{titulo}</Text>
            {marca}
          </View>
          {detalle ? (
            <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
              {detalle}
            </Text>
          ) : null}
        </View>
        <CaretRightIcon size={18} color={color.inkSoft} />
      </Presionable>
    </Animated.View>
  );
}

type AccionConfirmadaProps = {
  icono: ReactNode;
  titulo: string;
  detalle: string;
  /** Qué pasa al confirmar. */
  aviso: string;
  confirmar: string;
  destructiva?: boolean;
  abierta: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  onConfirmar: () => void;
  cargando?: boolean;
  error?: string | null;
  ultimo?: boolean;
};

/** La confirmación se despliega bajo la fila y no en un Alert, que en web no existe. */
export function AccionConfirmada({
  icono, titulo, detalle, aviso, confirmar, destructiva, abierta, onAbrir, onCerrar, onConfirmar, cargando, error, ultimo,
}: AccionConfirmadaProps) {
  return (
    <Animated.View layout={ACOMODO} className={cn('overflow-hidden', !ultimo && DIVISOR)}>
      <Presionable
        accessibilityRole="button"
        accessibilityLabel={titulo}
        accessibilityHint={detalle}
        accessibilityState={{ expanded: abierta }}
        disabled={abierta}
        onPress={onAbrir}
        hundir={0.985}
        contentClassName="min-h-[56px] flex-row items-center gap-3 py-3">
        <View className={cn('h-10 w-10 items-center justify-center rounded-full', destructiva ? 'bg-danger-bg' : 'bg-quiet')}>
          {icono}
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="bodyMedium" className={destructiva ? 'text-danger' : 'text-ink'}>
            {titulo}
          </Text>
          <Text variant="caption" className="text-ink-soft">
            {detalle}
          </Text>
        </View>
      </Presionable>
      {abierta ? (
        <Animated.View
          entering={DESPLIEGA}
          exiting={SALE}
          accessibilityLiveRegion="polite"
          className={cn(
            'mb-3 gap-3 rounded-field border p-4',
            'bg-surface', destructiva ? 'border-danger' : 'border-line',
          )}>
          <Text variant="body" className={destructiva ? 'text-danger' : 'text-ink'}>
            {aviso}
          </Text>
          {error ? (
            <Text variant="label" className="text-danger">
              {error}
            </Text>
          ) : null}
          <View className="flex-row gap-2">
            <Button label="Cancelar" variant="secondary" onPress={onCerrar} disabled={cargando} className="flex-1" />
            <Button
              label={confirmar}
              variant={destructiva ? 'danger' : 'primary'}
              onPress={onConfirmar}
              loading={cargando}
              className="flex-1"
            />
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
