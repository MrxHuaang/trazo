import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { useConsultorio, useCrearCita, useCuposSolidariosSemana, usePaciente } from '@/data/hooks';
import { ErrorSolape, type Modalidad, type Paciente } from '@/domain/types';
import { fechaClave, fechaCorta, horaTexto, isoDesde, sumarMinutos } from '@/lib/dates';
import { confirmarCupoSolidario } from '@/features/solidario/cupos';
import { cn } from '@/lib/cn';
import { tile } from '@/theme';
import { Aparecer, Button, Field, HatchOverlay, Segmented, Sheet, SheetHeader, Text, ToggleRow } from '@/ui';

import { confirmar } from './confirmar';
import { programarAviso } from './notifications';
import { PacienteSelector } from './paciente-selector';
import { aHora, aMinutos, diasDesde, DURACIONES, modalidadEn, MODALIDADES, normalizarEnlace, sugiereSolidaria } from './rules';
import { SelectorHorario, useHorasDelDia } from './selector-horario';
import { Opciones } from './selectores';
import { useAhoraMs } from './use-ahora-ms';

const DIAS_ADELANTE = 21;

const esFecha = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

/**
 * Nueva cita (HU-04): llega con la hora del hueco tocado y la duración por defecto.
 * Paciente con buscador y creación en contexto, cupo solidario con aviso de RN-03,
 * choque de horario en línea (RN-01) y aviso local al guardar (HU-07).
 */
export function NuevaCitaSheet() {
  const params = useLocalSearchParams<{ inicio?: string; pacienteId?: string }>();
  const inicioParam = esFecha(params.inicio) ? params.inicio : null;
  const pacienteIdParam = typeof params.pacienteId === 'string' ? params.pacienteId : undefined;

  const ahoraMs = useAhoraMs();
  const hoy = fechaClave(new Date(ahoraMs));
  const consultorio = useConsultorio().data;
  const pacienteParam = usePaciente(pacienteIdParam).data ?? null;
  const crear = useCrearCita();

  // Paciente: el elegido en la hoja o, mientras no se cambie, el que llega por parámetro.
  const [eleccion, setEleccion] = useState<{ paciente: Paciente | null; nuevo: boolean } | null>(null);
  const paciente = eleccion ? eleccion.paciente : pacienteParam;
  const pacienteNuevo = eleccion?.nuevo ?? false;

  const [fecha, setFecha] = useState(inicioParam ? fechaClave(inicioParam) : hoy);
  const [hora, setHora] = useState<string | null>(inicioParam ? horaTexto(inicioParam) : null);
  const [todas, setTodas] = useState(false);
  const [duracionElegida, setDuracion] = useState<number | null>(null);
  const [modalidadElegida, setModalidad] = useState<Modalidad | null>(null);
  const [enlace, setEnlace] = useState('');
  const [solidariaElegida, setSolidaria] = useState<boolean | null>(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const duracion = duracionElegida ?? consultorio?.duracionCita ?? 50;
  const datos = useHorasDelDia({ fecha, hora, duracion, ahoraMs, todas });
  const horaLista = datos.seleccion?.estado === 'libre' ? datos.seleccion.hora : null;

  // Valores por defecto derivados: la modalidad de la franja y el cupo solidario según el paciente.
  const modalidad = modalidadElegida ?? (hora ? modalidadEn(datos.franjas, aMinutos(hora)) : undefined) ?? 'presencial';
  const solidaria = solidariaElegida ?? (paciente ? sugiereSolidaria(paciente) : false);

  const cuposUsados = useCuposSolidariosSemana(fecha).data ?? 0;
  const cuposTotal = consultorio?.cuposSolidariosSemana ?? 0;
  const cuposAgotados = !!consultorio && solidaria && cuposUsados >= cuposTotal;

  const proximos = diasDesde(hoy, DIAS_ADELANTE);
  const dias = proximos.includes(fecha) ? proximos : [...proximos, fecha].sort();

  const opcionesDuracion = [...new Set([...DURACIONES, duracion])]
    .sort((a, b) => a - b)
    .map((d) => ({ valor: d, etiqueta: `${d} min` }));

  const falta = !paciente ? 'Elige un paciente.' : !horaLista ? 'Elige una hora libre.' : null;

  const guardar = async () => {
    if (!paciente || !horaLista || guardando) return;
    setError(null);
    // RN-03: la regla de cupos vive en el módulo solidario; aquí solo se pregunta.
    if (solidaria && !(await confirmarCupoSolidario(fecha))) return;
    setGuardando(true);
    try {
      const inicio = isoDesde(fecha, horaLista);
      const cita = await crear.mutateAsync({
        pacienteId: paciente.id,
        inicio,
        fin: sumarMinutos(inicio, duracion),
        modalidad,
        enlace: modalidad === 'virtual' ? normalizarEnlace(enlace) : null,
        motivo: motivo.trim() || null,
        esSolidaria: solidaria,
      });
      await programarAviso(cita.id, cita.inicio);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (pacienteNuevo) {
        const completar = await confirmar({
          titulo: 'Cita agendada',
          mensaje: `${paciente.nombre} es paciente nuevo. Puedes completar su teléfono y tarifa en la ficha.`,
          aceptar: 'Abrir ficha',
          cancelar: 'Después',
        });
        if (completar) {
          router.replace({ pathname: '/paciente/[id]', params: { id: paciente.id } });
          return;
        }
      }
      router.back();
    } catch (e) {
      setError(
        e instanceof ErrorSolape || (e instanceof Error && e.name === 'ErrorSolape')
          ? 'Ese horario se cruza con otra cita. Elige otra hora.'
          : 'No se pudo guardar la cita. Intenta de nuevo.',
      );
      setGuardando(false);
    }
  };

  const horaFin = horaLista ? aHora(aMinutos(horaLista) + duracion) : null;

  return (
    <Sheet
      header={
        <SheetHeader
          title="Nueva cita"
          subtitle={`${fechaCorta(isoDesde(fecha))}${horaLista && horaFin ? ` · ${horaLista} a ${horaFin}` : ''}`}
        />
      }
      footer={
        <>
          {error ? (
            <Text variant="label" className="text-danger" accessibilityRole="alert">
              {error}
            </Text>
          ) : falta ? (
            <Text variant="caption" className="text-ink-soft">
              {falta}
            </Text>
          ) : null}
          <Button label="Agendar" onPress={guardar} loading={guardando} disabled={!!falta} />
        </>
      }>
      <Aparecer orden={0}>
        <PacienteSelector
          valor={paciente}
          nuevo={pacienteNuevo}
          autoFocus={!pacienteIdParam}
          onChange={(p, nuevo) => {
            setEleccion({ paciente: p, nuevo });
            setSolidaria(null);
          }}
        />
      </Aparecer>

      <Aparecer orden={1}>
        <SelectorHorario
          dias={dias}
          hoy={hoy}
          fecha={fecha}
          onFecha={(f) => {
            setFecha(f);
            setError(null);
          }}
          hora={hora}
          onHora={(h) => {
            setHora(h);
            setError(null);
          }}
          todas={todas}
          onTodas={setTodas}
          datos={datos}
        />
      </Aparecer>

      <Aparecer orden={2} className="gap-2">
        <Text variant="label">Duración</Text>
        <Opciones opciones={opcionesDuracion} valor={duracion} onChange={setDuracion} />
      </Aparecer>

      <Aparecer orden={3} className="gap-2">
        <Text variant="label">Modalidad</Text>
        <Segmented options={MODALIDADES} value={modalidad} onChange={setModalidad} accessibilityLabel="Modalidad" />
      </Aparecer>

      {modalidad === 'virtual' ? (
        <Animated.View entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}>
          <Field
            label="Enlace de la videollamada"
            placeholder="meet.google.com/abc-defg-hij"
            value={enlace}
            onChangeText={setEnlace}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            helper="Opcional. Se incluye en los mensajes de WhatsApp."
          />
        </Animated.View>
      ) : null}

      <Aparecer orden={4} reacomodar>
        <View
          className={cn(
            'gap-1 overflow-hidden rounded-field border px-4 py-2',
            solidaria ? 'border-durazno bg-durazno' : 'border-line bg-transparent',
          )}>
          {solidaria ? <HatchOverlay color={tile.solidario.fg} opacity={0.08} /> : null}
          <ToggleRow
            label="Cupo solidario"
            description={
              paciente && sugiereSolidaria(paciente)
                ? 'Sugerido por la tarifa o la afectación del paciente.'
                : 'Cuenta en los cupos de la semana.'
            }
            value={solidaria}
            onChange={setSolidaria}
          />
          {consultorio && solidaria ? (
            <Text variant="caption" className="text-durazno-ink">
              {cuposAgotados
                ? `Esa semana ya tiene ${cuposUsados} de ${cuposTotal} cupos. Al agendar se pide confirmar.`
                : `Con esta cita: ${cuposUsados + 1} de ${cuposTotal} cupos de esa semana.`}
            </Text>
          ) : null}
        </View>
      </Aparecer>

      <Aparecer orden={5} reacomodar>
        <Field
          label="Motivo"
          placeholder="Opcional"
          value={motivo}
          onChangeText={setMotivo}
          helper="Solo lo ves tú. No aparece en los avisos."
        />
      </Aparecer>
    </Sheet>
  );
}
