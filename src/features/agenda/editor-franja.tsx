import * as Haptics from 'expo-haptics';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutUp, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import type { Disponibilidad, Modalidad } from '@/domain/types';
import { color } from '@/theme';
import { Button, Segmented, Text } from '@/ui';

import { BotonIcono } from './boton-icono';
import { confirmar } from './confirmar';
import { useBorrarFranja, useGuardarFranja } from './hooks';
import { aHora, aMinutos, MODALIDADES, NOMBRES_DIA, PASO_MIN, seCruzan, VENTANA_FIN, VENTANA_INICIO } from './rules';
import { HoraTira } from './selectores';

type Props = {
  /** 1 = lunes … 7 = domingo */
  dia: number;
  /** Franja que se edita; sin ella se crea una nueva. */
  franja?: Disponibilidad;
  /** Las demás franjas del mismo día, para avisar si se cruzan. */
  otras: Disponibilidad[];
  onCerrar: () => void;
};

const horasEntre = (desde: number, hasta: number) => {
  const res: string[] = [];
  for (let m = desde; m <= hasta; m += PASO_MIN) res.push(aHora(m));
  return res;
};

/** Tramo sugerido para una franja nueva: 8:00 a 12:00 en un día vacío; si no, el último espacio libre de al menos una hora. */
function sugerir(otras: Disponibilidad[]) {
  if (otras.length === 0) return { ini: 8 * 60, fin: 12 * 60 };
  const ocupadas = otras
    .map((f) => ({ ini: aMinutos(f.horaInicio), fin: aMinutos(f.horaFin) }))
    .sort((a, b) => a.ini - b.ini);
  const libres: { ini: number; fin: number }[] = [];
  let cursor = VENTANA_INICIO;
  for (const f of ocupadas) {
    if (f.ini - cursor >= 60) libres.push({ ini: cursor, fin: f.ini });
    cursor = Math.max(cursor, f.fin);
  }
  if (VENTANA_FIN - cursor >= 60) libres.push({ ini: cursor, fin: VENTANA_FIN });
  const libre = libres[libres.length - 1];
  if (!libre) return { ini: VENTANA_INICIO, fin: VENTANA_INICIO + 60 };
  return { ini: libre.ini, fin: Math.min(libre.fin, libre.ini + 240) };
}

/** Editor en el sitio de una franja: inicio, fin y modalidad. */
export function EditorFranja({ dia, franja, otras, onCerrar }: Props) {
  const inicial = franja ? { ini: aMinutos(franja.horaInicio), fin: aMinutos(franja.horaFin) } : sugerir(otras);
  const [ini, setIni] = useState(inicial.ini);
  const [fin, setFin] = useState(inicial.fin);
  const [modalidad, setModalidad] = useState<Modalidad>(franja?.modalidad ?? 'presencial');
  const [error, setError] = useState<string | null>(null);
  const guardar = useGuardarFranja();
  const borrar = useBorrarFranja();

  const cruce = otras.some((f) => seCruzan({ ini, fin }, { ini: aMinutos(f.horaInicio), fin: aMinutos(f.horaFin) }));
  const nombreDia = NOMBRES_DIA[dia - 1] ?? '';

  const alGuardar = async () => {
    setError(null);
    try {
      await guardar.mutateAsync({
        id: franja?.id,
        datos: { diaSemana: dia, horaInicio: aHora(ini), horaFin: aHora(fin), modalidad },
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCerrar();
    } catch (e) {
      setError(e instanceof Error && e.name === 'ErrorFranja' ? e.message : 'No se pudo guardar la franja. Intenta de nuevo.');
    }
  };

  const alBorrar = async () => {
    if (!franja) return;
    const seguir = await confirmar({
      titulo: 'Borrar la franja',
      mensaje: `${nombreDia} de ${franja.horaInicio} a ${franja.horaFin} deja de ofrecerse. Las citas ya agendadas no cambian.`,
      aceptar: 'Borrar',
      destructiva: true,
    });
    if (!seguir) return;
    try {
      await borrar.mutateAsync(franja.id);
      onCerrar();
    } catch {
      setError('No se pudo borrar la franja. Intenta de nuevo.');
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
          {franja ? `Editar franja del ${nombreDia.toLowerCase()}` : `Nueva franja del ${nombreDia.toLowerCase()}`}
        </Text>
        {franja ? (
          <BotonIcono etiqueta="Borrar franja" icono={<TrashIcon size={18} color={color.danger} />} onPress={alBorrar} />
        ) : null}
      </View>

      <View className="gap-2">
        <Text variant="label">Desde las {aHora(ini)}</Text>
        <HoraTira
          etiqueta="Inicio"
          horas={horasEntre(VENTANA_INICIO, VENTANA_FIN - PASO_MIN)}
          valor={aHora(ini)}
          onChange={(h) => {
            const m = aMinutos(h);
            setIni(m);
            if (fin <= m) setFin(Math.min(VENTANA_FIN, m + 60));
            setError(null);
          }}
        />
      </View>

      <View className="gap-2">
        <Text variant="label">Hasta las {aHora(fin)}</Text>
        <HoraTira
          etiqueta="Fin"
          horas={horasEntre(ini + PASO_MIN, VENTANA_FIN)}
          valor={aHora(fin)}
          onChange={(h) => {
            setFin(aMinutos(h));
            setError(null);
          }}
        />
      </View>

      <Segmented options={MODALIDADES} value={modalidad} onChange={setModalidad} accessibilityLabel="Modalidad de la franja" />

      {cruce || error ? (
        <Animated.View entering={FadeIn.duration(160).reduceMotion(ReduceMotion.System)}>
          <Text variant="caption" className="text-danger" accessibilityRole="alert">
            {cruce ? 'Se cruza con otra franja de este día. Ajusta las horas.' : error}
          </Text>
        </Animated.View>
      ) : null}

      <View className="flex-row gap-2">
        <Button label="Volver" variant="ghost" onPress={onCerrar} className="flex-1" />
        <Button label="Guardar" onPress={alGuardar} loading={guardar.isPending} disabled={cruce || borrar.isPending} className="flex-1" />
      </View>
    </Animated.View>
  );
}
