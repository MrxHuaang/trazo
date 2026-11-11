import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, type TextInput } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import type { Jornada } from '@/domain/types';
import { fechaClave, horaTexto, hoyClave, isoDesde } from '@/lib/dates';
import { color } from '@/theme';
import { Button, EmptyState, Field, Segmented, Sheet, SheetHeader, Text } from '@/ui';

import { Accion } from './components/accion';
import { TarjetaFantasma } from './components/jornada-tile';
import { SelectorDia, SelectorHora } from './components/selectores';
import { Stepper } from './components/stepper';
import { avisarError } from './dispositivo';
import { useActualizarJornada, useCrearJornada, useJornada } from './hooks';
import { textoCoordenadas } from './mapa/elegir-punto-screen';
import type { JornadaConInscritos } from './repo';
import { diasParaElegir, finConservandoDuracion, HORAS_INICIO, horasFin, plural, TIPOS_JORNADA } from './rules';
import { useUbicacionStore } from './store/use-ubicacion-store';

const MAX_CUPOS = 300;

/** Hoja "Programar jornada" (HU-20). Con `id` edita una jornada existente. */
export function JornadaFormSheet({ id }: { id?: string }) {
  const jornada = useJornada(id);

  if (!id) return <JornadaForm />;
  if (!jornada.data) {
    return (
      <Sheet header={<SheetHeader title="Editar jornada" />}>
        {jornada.isLoading ? null : <EmptyState title="No encontramos esta jornada" body="Puede que se haya eliminado." />}
      </Sheet>
    );
  }
  return <JornadaForm inicial={jornada.data} />;
}

function JornadaForm({ inicial }: { inicial?: JornadaConInscritos }) {
  const hoy = hoyClave();
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [tipo, setTipo] = useState<Jornada['tipo']>(inicial?.tipo ?? 'taller');
  const [lugar, setLugar] = useState(inicial?.lugar ?? '');
  const [barrio, setBarrio] = useState(inicial?.barrio ?? '');
  const [fecha, setFecha] = useState(inicial ? fechaClave(inicial.inicio) : hoy);
  const [horaInicio, setHoraInicio] = useState(inicial ? horaTexto(inicial.inicio) : '09:00');
  const [horaFin, setHoraFin] = useState(inicial ? horaTexto(inicial.fin) : '11:00');
  const [cupos, setCupos] = useState(inicial?.cupos ?? 20);
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [intentado, setIntentado] = useState(false);

  // El punto en el mapa vive en el store: el mapa en modo selección lo fija y este formulario lo lee.
  const punto = useUbicacionStore((s) => s.puntoJornada);
  const fijarPunto = useUbicacionStore((s) => s.fijarPuntoJornada);
  const latInicial = inicial?.latitud ?? null;
  const lngInicial = inicial?.longitud ?? null;
  useEffect(() => {
    fijarPunto(latInicial !== null && lngInicial !== null ? { latitud: latInicial, longitud: lngInicial } : null);
  }, [fijarPunto, latInicial, lngInicial]);

  const lugarRef = useRef<ComponentRef<typeof TextInput>>(null);
  const barrioRef = useRef<ComponentRef<typeof TextInput>>(null);

  const crear = useCrearJornada();
  const actualizar = useActualizarJornada();
  const guardando = crear.isPending || actualizar.isPending;

  const dias = diasParaElegir(hoy, 30, inicial ? fechaClave(inicial.inicio) : undefined);
  const errores = {
    titulo: !titulo.trim() ? 'Escribe un título para la jornada.' : undefined,
    lugar: !lugar.trim() ? 'Escribe dónde será.' : undefined,
  };
  const valido = !errores.titulo && !errores.lugar;

  const cambiarInicio = (hora: string) => {
    setHoraFin(finConservandoDuracion(hora, horaInicio, horaFin));
    setHoraInicio(hora);
  };

  const elegirEnMapa = () => router.push({ pathname: '/mapa', params: { elegir: '1' } });

  const guardar = () => {
    setIntentado(true);
    if (!valido) return;
    const datos = {
      titulo,
      tipo,
      lugar,
      barrio,
      inicio: isoDesde(fecha, horaInicio),
      fin: isoDesde(fecha, horaFin),
      cupos,
      descripcion,
      latitud: punto?.latitud ?? null,
      longitud: punto?.longitud ?? null,
    };
    const listo = () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    };
    const opciones = { onSuccess: listo, onError: avisarError('No se pudo guardar la jornada') };
    if (inicial) actualizar.mutate({ id: inicial.id, datos }, opciones);
    else crear.mutate(datos, opciones);
  };

  return (
    <Sheet
      header={<SheetHeader title={inicial ? 'Editar jornada' : 'Programar jornada'} subtitle="Taller, charla o atención grupal" />}
      footer={<Button label={inicial ? 'Guardar cambios' : 'Programar jornada'} onPress={guardar} loading={guardando} />}>
      <Field
        label="Título"
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ej.: Manejo de la ansiedad tras el sismo"
        autoCapitalize="sentences"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => lugarRef.current?.focus()}
        error={intentado ? errores.titulo : undefined}
      />

      <View className="gap-1.5">
        <Text variant="label">Tipo</Text>
        <Segmented options={TIPOS_JORNADA} value={tipo} onChange={setTipo} accessibilityLabel="Tipo de jornada" />
      </View>

      <Field
        ref={lugarRef}
        label="Lugar"
        value={lugar}
        onChangeText={setLugar}
        placeholder="Ej.: Salón comunal"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => barrioRef.current?.focus()}
        error={intentado ? errores.lugar : undefined}
      />
      <Field ref={barrioRef} label="Barrio (opcional)" value={barrio} onChangeText={setBarrio} placeholder="Ej.: Cuba" returnKeyType="done" />

      <View className="gap-1.5">
        <Text variant="label">Punto en el mapa (opcional)</Text>
        {punto ? (
          <Animated.View
            entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}
            className="flex-row items-center gap-3 rounded-field border border-line bg-surface p-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-menta">
              <MapPinIcon size={20} color={color.ink} weight="fill" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="bodyMedium">Ubicada en el mapa</Text>
              <Text variant="mono" className="text-ink-soft">
                {textoCoordenadas(punto)}
              </Text>
            </View>
            <Accion label="Cambiar" variante="texto" onPress={elegirEnMapa} accessibilityLabel="Cambiar el punto en el mapa" />
          </Animated.View>
        ) : (
          <TarjetaFantasma
            compacta
            label="Elegir en el mapa"
            detalle="Así aparece en el mapa solidario con «Cómo llegar»."
            onPress={elegirEnMapa}
          />
        )}
        {punto ? (
          <Accion label="Quitar el punto" variante="texto" onPress={() => fijarPunto(null)} className="self-start" />
        ) : null}
      </View>

      <SelectorDia label="Fecha" dias={dias} valor={fecha} hoy={hoy} onChange={setFecha} />
      <SelectorHora label="Empieza" horas={HORAS_INICIO} valor={horaInicio} onChange={cambiarInicio} />
      <SelectorHora label="Termina" horas={horasFin(horaInicio)} valor={horaFin} onChange={setHoraFin} />

      <View className="gap-1.5">
        <Text variant="label">Cupos</Text>
        <Stepper
          label="Cupos de la jornada"
          value={cupos}
          onChange={setCupos}
          min={1}
          max={MAX_CUPOS}
          pasoLargo={5}
          unidad={plural(cupos, 'persona', 'personas')}
        />
        <Text variant="caption" className="text-ink-soft">
          {inicial && inicial.inscritos > cupos
            ? `Ya hay ${inicial.inscritos} inscritos; puedes dejar menos cupos si así lo decides.`
            : 'Mantén presionado − o + para cambiar de a 5.'}
        </Text>
      </View>

      <Field
        label="Descripción (opcional)"
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Qué se va a trabajar y a quién va dirigida"
        multiline
      />
    </Sheet>
  );
}

