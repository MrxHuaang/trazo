import * as Haptics from 'expo-haptics';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import type { Bloqueo } from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto, isoDesde, minutosDelDia, sumarDias } from '@/lib/dates';
import { color } from '@/theme';
import { Button, Field, Text, ToggleRow } from '@/ui';

import { BotonIcono } from './boton-icono';
import { confirmar } from './confirmar';
import { useBorrarBloqueo, useGuardarBloqueo } from './hooks';
import { aHora, aMinutos, diasDesde, fechaTitulo, PASO_MIN, VENTANA_FIN, VENTANA_INICIO } from './rules';
import { FechaChips, HoraTira } from './selectores';

const DIAS_INICIO = 120;
const DIAS_FIN = 60;

/** Un bloqueo de día completo va de las 00:00 a las 00:00 del día siguiente al último. */
export function esDiaCompleto(b: Pick<Bloqueo, 'inicio' | 'fin'>) {
  return minutosDelDia(b.inicio) === 0 && minutosDelDia(b.fin) === 0;
}

/** 'lun 23 nov a vie 27 nov' o 'lun 23 nov, 14:00 a 16:00'. */
export function textoBloqueo(b: Pick<Bloqueo, 'inicio' | 'fin'>) {
  const desde = fechaClave(b.inicio);
  if (esDiaCompleto(b)) {
    const hasta = sumarDias(fechaClave(b.fin), -1);
    return hasta <= desde
      ? `${fechaCorta(b.inicio)}, todo el día`
      : `${fechaCorta(b.inicio)} a ${fechaCorta(isoDesde(hasta))}`;
  }
  const hasta = fechaClave(b.fin);
  return hasta === desde
    ? `${fechaCorta(b.inicio)}, ${horaTexto(b.inicio)} a ${horaTexto(b.fin)}`
    : `${fechaCorta(b.inicio)} ${horaTexto(b.inicio)} a ${fechaCorta(b.fin)} ${horaTexto(b.fin)}`;
}

const horasEntre = (desde: number, hasta: number) => {
  const res: string[] = [];
  for (let m = desde; m <= hasta; m += PASO_MIN) res.push(aHora(m));
  return res;
};

const ajustar = (min: number) => Math.min(VENTANA_FIN, Math.max(VENTANA_INICIO, Math.round(min / PASO_MIN) * PASO_MIN));

type Props = {
  bloqueo?: Bloqueo;
  hoy: string;
  onCerrar: () => void;
};

/** Editor en el sitio de un bloqueo: desde, hasta, todo el día o por horas, y motivo. */
export function EditorBloqueo({ bloqueo, hoy, onCerrar }: Props) {
  const completoInicial = bloqueo ? esDiaCompleto(bloqueo) : true;
  const [desde, setDesde] = useState(bloqueo ? fechaClave(bloqueo.inicio) : hoy);
  const [hasta, setHasta] = useState(
    bloqueo ? (completoInicial ? sumarDias(fechaClave(bloqueo.fin), -1) : fechaClave(bloqueo.fin)) : hoy,
  );
  const [todoElDia, setTodoElDia] = useState(completoInicial);
  const [horaIni, setHoraIni] = useState(bloqueo && !completoInicial ? ajustar(minutosDelDia(bloqueo.inicio)) : 12 * 60);
  const [horaFin, setHoraFin] = useState(bloqueo && !completoInicial ? ajustar(minutosDelDia(bloqueo.fin)) : 14 * 60);
  const [motivo, setMotivo] = useState(bloqueo?.motivo ?? '');
  const [error, setError] = useState<string | null>(null);
  const guardar = useGuardarBloqueo();
  const borrar = useBorrarBloqueo();

  const base = desde < hoy ? desde : hoy;
  const diasDesdeLista = diasDesde(base, DIAS_INICIO);
  const diasInicio = diasDesdeLista.includes(desde) ? diasDesdeLista : [...diasDesdeLista, desde].sort();
  const diasHastaLista = diasDesde(desde, DIAS_FIN);
  const diasFin = diasHastaLista.includes(hasta) ? diasHastaLista : [...diasHastaLista, hasta].sort();

  const inicioIso = isoDesde(desde, todoElDia ? '00:00' : aHora(horaIni));
  const finIso = todoElDia ? isoDesde(sumarDias(hasta, 1)) : isoDesde(hasta, aHora(horaFin));
  const invalido = finIso <= inicioIso;

  const alGuardar = async () => {
    setError(null);
    try {
      await guardar.mutateAsync({ id: bloqueo?.id, datos: { inicio: inicioIso, fin: finIso, motivo: motivo.trim() || null } });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCerrar();
    } catch (e) {
      setError(e instanceof Error && e.name === 'ErrorFranja' ? e.message : 'No se pudo guardar el bloqueo. Intenta de nuevo.');
    }
  };

  const alBorrar = async () => {
    if (!bloqueo) return;
    const seguir = await confirmar({
      titulo: 'Borrar el bloqueo',
      mensaje: 'Esas horas vuelven a ofrecerse para citas.',
      aceptar: 'Borrar',
      destructiva: true,
    });
    if (!seguir) return;
    try {
      await borrar.mutateAsync(bloqueo.id);
      onCerrar();
    } catch {
      setError('No se pudo borrar el bloqueo. Intenta de nuevo.');
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).reduceMotion(ReduceMotion.System)}
      exiting={FadeOutUp.duration(160).reduceMotion(ReduceMotion.System)}
      layout={LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System)}
      className="gap-3 overflow-hidden rounded-tile border border-line bg-surface p-4">
      <View className="min-h-[44px] flex-row items-center gap-2">
        <Text variant="bodyMedium" className="flex-1">
          {bloqueo ? 'Editar bloqueo' : 'Nuevo bloqueo'}
        </Text>
        {bloqueo ? (
          <BotonIcono etiqueta="Borrar bloqueo" icono={<TrashIcon size={18} color={color.danger} />} onPress={alBorrar} />
        ) : null}
      </View>

      <View className="gap-2">
        <Text variant="label">Desde · {fechaTitulo(desde)}</Text>
        <FechaChips
          dias={diasInicio}
          valor={desde}
          hoy={hoy}
          onChange={(d) => {
            setDesde(d);
            if (hasta < d) setHasta(d);
            setError(null);
          }}
        />
      </View>

      <View className="gap-2">
        <Text variant="label">Hasta · {fechaTitulo(hasta)}</Text>
        <FechaChips
          dias={diasFin}
          valor={hasta}
          hoy={hoy}
          onChange={(d) => {
            setHasta(d);
            setError(null);
          }}
        />
      </View>

      <ToggleRow
        label="Todo el día"
        description="Desactívalo para bloquear solo unas horas."
        value={todoElDia}
        onChange={setTodoElDia}
      />

      {todoElDia ? null : (
        <Animated.View
          entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(140).reduceMotion(ReduceMotion.System)}
          className="gap-3">
          <View className="gap-2">
            <Text variant="label">Empieza a las {aHora(horaIni)}</Text>
            <HoraTira
              etiqueta="Empieza"
              horas={horasEntre(VENTANA_INICIO, VENTANA_FIN - PASO_MIN)}
              valor={aHora(horaIni)}
              onChange={(h) => {
                const m = aMinutos(h);
                setHoraIni(m);
                if (hasta === desde && horaFin <= m) setHoraFin(Math.min(VENTANA_FIN, m + 60));
              }}
            />
          </View>
          <View className="gap-2">
            <Text variant="label">Termina a las {aHora(horaFin)}</Text>
            <HoraTira
              etiqueta="Termina"
              horas={horasEntre(VENTANA_INICIO + PASO_MIN, VENTANA_FIN)}
              valor={aHora(horaFin)}
              onChange={(h) => setHoraFin(aMinutos(h))}
            />
          </View>
        </Animated.View>
      )}

      <Field
        label="Motivo"
        placeholder="Vacaciones, jornada, diligencia"
        value={motivo}
        onChangeText={setMotivo}
        helper="Opcional. Se muestra en la agenda sobre las horas bloqueadas."
        returnKeyType="done"
      />

      {invalido || error ? (
        <Animated.View entering={FadeIn.duration(160).reduceMotion(ReduceMotion.System)}>
          <Text variant="caption" className="text-danger" accessibilityRole="alert">
            {invalido ? 'El bloqueo debe terminar después de empezar.' : error}
          </Text>
        </Animated.View>
      ) : null}

      <View className="flex-row gap-2">
        <Button label="Volver" variant="ghost" onPress={onCerrar} className="flex-1" />
        <Button label="Guardar" onPress={alGuardar} loading={guardar.isPending} disabled={invalido || borrar.isPending} className="flex-1" />
      </View>
    </Animated.View>
  );
}
