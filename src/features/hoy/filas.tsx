import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { WhatsappLogoIcon } from 'phosphor-react-native/src/icons/WhatsappLogo';
import type { ReactNode } from 'react';
import { Alert, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { useActualizarSeguimiento } from '@/data/hooks';
import type { CitaConPaciente, Seguimiento } from '@/domain/types';
import { fechaCorta, horaTexto, isoDesde } from '@/lib/dates';
import { abrirWhatsApp, llamar } from '@/lib/whatsapp';
import { tile } from '@/theme';
import { ListRow, SolidarioMark, Text } from '@/ui';

import { Accion } from './accion';
import { FilaDeslizable } from './fila-deslizable';
import { useRegistrarContacto } from './hooks';
import { mensajeContacto } from './mensajes';
import type { ParaContactar } from './rules';
import { useAsistio, useRecordar } from './use-recordar';

export const abrirCita = (id: string) => router.push({ pathname: '/cita/[id]', params: { id } });

/** Fila de una lista viva: al salir se desvanece y las demás se reacomodan con resorte. */
export function FilaAnimada({ children }: { children: ReactNode }) {
  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System)}
      exiting={FadeOut.duration(180).reduceMotion(ReduceMotion.System)}>
      {children}
    </Animated.View>
  );
}

type FilaCitaProps = {
  cita: CitaConPaciente;
  subtitulo: string;
  last: boolean;
};

/**
 * Cita en "Siguientes" y "Por confirmar". Deslizar a la derecha envía el recordatorio por WhatsApp (HU-06);
 * a la izquierda marca "asistió". Tocar la fila abre el detalle, donde están todas las acciones.
 */
export function FilaCita({ cita: c, subtitulo, last }: FilaCitaProps) {
  const { recordar, marcando, disponible } = useRecordar();
  const { asistio } = useAsistio();
  const sinTelefono = !c.paciente.telefono;
  const puedeRecordar = !c.recordadaEn && !sinTelefono && disponible;

  return (
    <FilaAnimada>
      <FilaDeslizable
        derecha={
          puedeRecordar
            ? {
                etiqueta: 'Recordar',
                icono: <WhatsappLogoIcon size={20} color={tile.confirmar.fg} />,
                onAccion: () => void recordar(c),
              }
            : undefined
        }
        izquierda={{
          etiqueta: 'Asistió',
          icono: <CheckIcon size={20} color={tile.consulta.fg} weight="bold" />,
          onAccion: () => void asistio(c),
        }}>
        <ListRow
          lead={horaTexto(c.inicio)}
          title={c.paciente.nombre}
          subtitle={subtitulo}
          badge={c.esSolidaria ? <SolidarioMark /> : null}
          last={last}
          onPress={() => abrirCita(c.id)}
          accessibilityLabel={`${horaTexto(c.inicio)}, ${c.paciente.nombre}, ${subtitulo}. Abre el detalle de la cita`}
          accessibilityActions={[
            ...(puedeRecordar ? [{ name: 'recordar', label: 'Recordar por WhatsApp' }] : []),
            { name: 'asistio', label: 'Marcar que asistió' },
          ]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'recordar') void recordar(c);
            if (e.nativeEvent.actionName === 'asistio') void asistio(c);
          }}
          trailing={
            c.recordadaEn ? (
              <Text variant="caption" className="text-ink-soft">
                Recordada
              </Text>
            ) : (
              <Accion
                label="Recordar"
                accessibilityLabel={
                  sinTelefono
                    ? `${c.paciente.nombre} no tiene teléfono registrado`
                    : `Recordar la cita a ${c.paciente.nombre} por WhatsApp`
                }
                accessibilityHint={sinTelefono ? undefined : 'Abre WhatsApp con el mensaje listo y marca la cita como recordada'}
                disabled={!puedeRecordar}
                loading={marcando === c.id}
                onPress={() => void recordar(c)}
              />
            )
          }
        />
      </FilaDeslizable>
    </FilaAnimada>
  );
}

export function FilaSeguimiento({ seguimiento: s, hoy, last }: { seguimiento: Seguimiento; hoy: string; last: boolean }) {
  const actualizar = useActualizarSeguimiento();
  const cuando = s.fechaObjetivo === hoy ? 'Hoy' : `Desde el ${fechaCorta(isoDesde(s.fechaObjetivo))}`;
  const telefono = s.telefono;
  return (
    <FilaAnimada>
      <ListRow
        title={s.nombre}
        subtitle={`${cuando} · ${s.motivo}`}
        last={last}
        trailing={
          <View className="flex-row items-center gap-2">
            <Accion
              label="Llamar"
              accessibilityLabel={telefono ? `Llamar a ${s.nombre}` : `${s.nombre} no tiene teléfono registrado`}
              disabled={!telefono}
              onPress={() => {
                if (telefono) void llamar(telefono).catch(() => Alert.alert('No se pudo iniciar la llamada'));
              }}
            />
            <Accion
              label="Hecho"
              accessibilityLabel={`Marcar como hecho el seguimiento de ${s.nombre}`}
              loading={actualizar.isPending}
              onPress={() =>
                actualizar.mutate(
                  { id: s.id, cambios: { estado: 'hecho' } },
                  { onSuccess: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) },
                )
              }
            />
          </View>
        }
      />
    </FilaAnimada>
  );
}

/** RN-06: dos inasistencias seguidas. El contacto queda como seguimiento hecho y la fila sale de la lista. */
export function FilaContacto({ paciente: p, last }: { paciente: ParaContactar; last: boolean }) {
  const registrar = useRegistrarContacto();
  const telefono = p.telefono;

  async function escribir() {
    if (!telefono) return;
    try {
      await abrirWhatsApp(telefono, mensajeContacto(p.nombre));
    } catch {
      Alert.alert('No se pudo abrir WhatsApp', 'Revisa que WhatsApp esté instalado en este teléfono.');
      return;
    }
    registrar.mutate(
      { pacienteId: p.pacienteId, nombre: p.nombre, telefono },
      { onSuccess: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) },
    );
  }

  return (
    <FilaAnimada>
      <ListRow
        title={p.nombre}
        subtitle={telefono ? 'Dos inasistencias seguidas' : 'Dos inasistencias seguidas · sin teléfono'}
        last={last}
        onPress={() => router.push({ pathname: '/paciente/[id]', params: { id: p.pacienteId } })}
        trailing={
          <Accion
            label="WhatsApp"
            accessibilityLabel={telefono ? `Escribir a ${p.nombre} por WhatsApp` : `${p.nombre} no tiene teléfono registrado`}
            disabled={!telefono}
            loading={registrar.isPending}
            onPress={() => void escribir()}
          />
        }
      />
    </FilaAnimada>
  );
}
