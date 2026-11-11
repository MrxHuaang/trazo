import * as Haptics from 'expo-haptics';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { ClockClockwiseIcon } from 'phosphor-react-native/src/icons/ClockClockwise';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { WhatsappLogoIcon } from 'phosphor-react-native/src/icons/WhatsappLogo';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import Swipeable, { SwipeDirection, type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn, FadeOutLeft, FadeOutRight, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { useActualizarSeguimiento, useCrearSeguimiento } from '@/data/hooks';
import type { Seguimiento } from '@/domain/types';
import { cn } from '@/lib/cn';
import { sumarDias } from '@/lib/dates';
import { color, tile } from '@/theme';
import { Button, Field, Text, ToggleRow } from '@/ui';

import { avisarError, escribirPorWhatsApp, llamarA } from '../dispositivo';
import { DIAS_SEGUIMIENTO, detalleSeguimiento, diaMes, etiquetaDia, fechaPospuesta, mensajeSeguimiento } from '../rules';
import { Accion } from './accion';

type SeguimientoItemProps = {
  seguimiento: Seguimiento;
  hoy: string;
  /** Muestra la acción WhatsApp (en la lista completa). */
  conWhatsApp?: boolean;
  /** El botón "Hecho" abre un panel con nota opcional y la opción de programar otro (RN-08). */
  conNota?: boolean;
  profesional?: string | null;
  last?: boolean;
};

const exito = () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

/**
 * Seguimiento pendiente o hecho. Acciones: Llamar, WhatsApp, Hecho y Posponer 7 días.
 * La fila también se desliza: a la derecha marca Hecho, a la izquierda pospone. Al resolverse
 * sale hacia el lado del gesto y las demás filas se reacomodan.
 */
export function SeguimientoItem({ seguimiento: s, hoy, conWhatsApp, conNota, profesional, last }: SeguimientoItemProps) {
  const actualizar = useActualizarSeguimiento();
  const crear = useCrearSeguimiento();
  const deslizable = useRef<SwipeableMethods>(null);
  const [cerrando, setCerrando] = useState(false);
  const [nota, setNota] = useState('');
  const [otro, setOtro] = useState(false);
  const [salida, setSalida] = useState<'derecha' | 'izquierda'>('derecha');

  const hecho = s.estado === 'hecho';
  const vencido = !hecho && s.fechaObjetivo < hoy;
  const sinTelefono = !s.telefono;

  const marcarHecho = async (conTexto: boolean) => {
    setSalida('derecha');
    try {
      await actualizar.mutateAsync({
        id: s.id,
        cambios: conTexto ? { estado: 'hecho', nota: nota.trim() ? nota.trim() : null } : { estado: 'hecho' },
      });
      exito();
      if (conTexto && otro) {
        await crear.mutateAsync({
          nombre: s.nombre,
          telefono: s.telefono,
          fechaObjetivo: sumarDias(hoy, DIAS_SEGUIMIENTO),
          motivo: s.motivo,
          pacienteId: s.pacienteId,
          asistenteId: s.asistenteId,
        });
      }
    } catch (e) {
      deslizable.current?.close();
      avisarError('No se pudo marcar como hecho')(e);
    }
  };

  const posponer = async () => {
    setSalida('izquierda');
    try {
      await actualizar.mutateAsync({ id: s.id, cambios: { fechaObjetivo: fechaPospuesta(s.fechaObjetivo, hoy) } });
      exito();
    } catch (e) {
      avisarError('No se pudo posponer')(e);
    } finally {
      // Si la fila sigue en la lista (solo cambió de fecha), vuelve a su sitio.
      deslizable.current?.close();
    }
  };

  const alAbrir = (direccion: SwipeDirection) => {
    if (direccion === SwipeDirection.RIGHT) void marcarHecho(false);
    else void posponer();
  };

  const fila = (
    <View className="gap-2 bg-canvas py-3">
      <View className="flex-row items-start gap-3">
        <Text variant="mono" className={cn('w-[52px] pt-0.5', vencido ? 'text-danger' : 'text-ink-soft')}>
          {hecho ? diaMes(s.fechaObjetivo) : etiquetaDia(s.fechaObjetivo, hoy)}
        </Text>
        <View className="flex-1 gap-0.5">
          <Text variant="bodyMedium" numberOfLines={1}>
            {s.nombre}
          </Text>
          <Text variant="caption" className="text-ink-soft" numberOfLines={3}>
            {detalleSeguimiento(s, hoy)}
          </Text>
        </View>
      </View>

      {!hecho && !cerrando ? (
        <View className="flex-row flex-wrap gap-2 pl-16">
          <Accion
            label="Llamar"
            icon={PhoneIcon}
            onPress={() => llamarA(s.telefono)}
            disabled={sinTelefono}
            accessibilityLabel={`Llamar a ${s.nombre}`}
            accessibilityHint={sinTelefono ? 'No tiene teléfono registrado' : undefined}
          />
          {conWhatsApp ? (
            <Accion
              label="WhatsApp"
              icon={WhatsappLogoIcon}
              onPress={() => escribirPorWhatsApp(s.telefono, mensajeSeguimiento(s.nombre, profesional))}
              disabled={sinTelefono}
              accessibilityLabel={`Escribir a ${s.nombre} por WhatsApp`}
              accessibilityHint={sinTelefono ? 'No tiene teléfono registrado' : 'Abre WhatsApp con un saludo listo'}
            />
          ) : null}
          <Accion
            label="Hecho"
            icon={CheckIcon}
            onPress={() => (conNota ? setCerrando(true) : void marcarHecho(false))}
            disabled={actualizar.isPending}
            accessibilityLabel={`Marcar hecho el seguimiento de ${s.nombre}`}
          />
          <Accion
            label="Posponer 7 días"
            icon={ClockClockwiseIcon}
            onPress={() => void posponer()}
            disabled={actualizar.isPending}
            accessibilityLabel={`Posponer 7 días el seguimiento de ${s.nombre}`}
          />
        </View>
      ) : null}

      {cerrando ? (
        <View className="gap-2 rounded-field border border-line bg-surface p-4">
          <Field
            label="Nota (opcional)"
            value={nota}
            onChangeText={setNota}
            multiline
            className="min-h-[84px]"
            helper="Queda en el seguimiento. No aparece en el informe."
            autoFocus
          />
          <ToggleRow
            label="Programar otro en 7 días"
            description="Crea un nuevo seguimiento para la misma persona."
            value={otro}
            onChange={setOtro}
          />
          <View className="flex-row justify-end gap-2">
            <Button label="Cancelar" variant="ghost" size="sm" onPress={() => setCerrando(false)} />
            <Button
              label="Marcar hecho"
              size="sm"
              onPress={() => void marcarHecho(true)}
              loading={actualizar.isPending || crear.isPending}
            />
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <Animated.View
      className={cn(!last && 'border-b border-line')}
      entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}
      exiting={(salida === 'derecha' ? FadeOutRight : FadeOutLeft).duration(240).reduceMotion(ReduceMotion.System)}
      layout={LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System)}>
      {hecho ? (
        fila
      ) : (
        <Swipeable
          ref={deslizable}
          enabled={!cerrando && !actualizar.isPending}
          friction={1.6}
          leftThreshold={84}
          rightThreshold={84}
          overshootFriction={8}
          onSwipeableOpen={alAbrir}
          renderLeftActions={() => (
            <View className="flex-1 flex-row items-center gap-2 rounded-field bg-menta px-5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <CheckIcon size={22} color={tile.confirmar.fg} weight="bold" />
              <Text variant="bodyMedium" className="text-menta-ink">
                Hecho
              </Text>
            </View>
          )}
          renderRightActions={() => (
            <View className="flex-1 flex-row items-center justify-end gap-2 rounded-field bg-quiet px-5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text variant="bodyMedium">7 días más</Text>
              <ClockClockwiseIcon size={22} color={color.ink} />
            </View>
          )}>
          {fila}
        </Swipeable>
      )}
    </Animated.View>
  );
}
