import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { IdentificationCardIcon } from 'phosphor-react-native/src/icons/IdentificationCard';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { MapTrifoldIcon } from 'phosphor-react-native/src/icons/MapTrifold';
import { NavigationArrowIcon } from 'phosphor-react-native/src/icons/NavigationArrow';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { useRef, useState, type ComponentRef } from 'react';
import { Alert, View, type TextInput } from 'react-native';
import Animated, { FadeInDown, FadeOut, LayoutAnimationConfig, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import type { Asistente } from '@/domain/types';
import { fechaLarga, horaTexto, hoyClave } from '@/lib/dates';
import { formatoTelefono } from '@/lib/format';
import { color, tile } from '@/theme';
import { Aparecer, Button, EmptyState, Field, NumeroAnimado, Text, Tile, ToggleRow } from '@/ui';

import { Accion, BotonIcono } from './components/accion';
import { PantallaDetalle } from './components/pantalla-detalle';
import { Seccion } from './components/seccion';
import { avisarError, comoLlegar, llamarA } from './dispositivo';
import {
  useAsistentes,
  useConvertirEnPaciente,
  useEliminarAsistente,
  useEliminarJornada,
  useJornada,
  useRegistrarAsistente,
} from './hooks';
import { buscarPacientePorTelefono, type JornadaConInscritos } from './repo';
import { capitalizar, diaMes, etiquetaTipo, fechaSeguimientoAsistente, plural } from './rules';

/** Jornada (HU-20, HU-21): datos, inscritos de cupos y registro rápido de asistentes. */
export function JornadaScreen({ id }: { id: string }) {
  const jornada = useJornada(id);

  if (!jornada.data) {
    return (
      <PantallaDetalle>
        {jornada.isLoading ? null : <EmptyState title="No encontramos esta jornada" body="Puede que se haya eliminado." />}
      </PantallaDetalle>
    );
  }
  return <Detalle jornada={jornada.data} />;
}

function Detalle({ jornada: j }: { jornada: JornadaConInscritos }) {
  const asistentes = useAsistentes(j.id);
  const eliminar = useEliminarJornada();
  const lista = asistentes.data ?? [];
  const inscritos = asistentes.data ? lista.length : j.inscritos;
  const fg = tile.confirmar.fg;
  const conPunto = typeof j.latitud === 'number' && typeof j.longitud === 'number';

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar jornada',
      `Se borran la jornada y su lista de ${plural(inscritos, '1 asistente', `${inscritos} asistentes`)}. Los seguimientos pendientes se conservan. Esto no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          // Se sale primero: al borrarse la jornada esta pantalla se queda sin datos y sus callbacks ya no corren.
          onPress: () => {
            eliminar.mutateAsync(j.id).catch(avisarError('No se pudo eliminar la jornada'));
            if (router.canGoBack()) router.back();
            else router.replace('/solidario');
          },
        },
      ],
    );
  };

  return (
    <PantallaDetalle
      acciones={
        <>
          <BotonIcono
            icon={PencilSimpleIcon}
            label="Editar jornada"
            onPress={() => router.push({ pathname: '/jornada/nueva', params: { id: j.id } })}
          />
          <BotonIcono icon={TrashIcon} label="Eliminar jornada" tone={color.danger} onPress={confirmarEliminar} disabled={eliminar.isPending} />
        </>
      }>
      <Aparecer orden={0} className="gap-1">
        <Text variant="label" className="text-ink-soft">
          {etiquetaTipo(j.tipo)} · {capitalizar(fechaLarga(j.inicio))}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {j.titulo}
        </Text>
      </Aparecer>

      <Aparecer orden={1}>
        <Tile tone="confirmar" contentClassName="gap-2">
          <View className="mb-1 flex-row items-baseline gap-2" accessible accessibilityLabel={`${inscritos} de ${j.cupos} inscritos`}>
            <NumeroAnimado valor={inscritos} variant="number" className="text-menta-ink" />
            <Text variant="title" className="text-menta-ink">
              de {j.cupos}
            </Text>
            <Text variant="bodyMedium" className="text-menta-ink">
              inscritos
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <ClockIcon size={18} color={fg} />
            <Text variant="body" className="text-menta-ink">
              {horaTexto(j.inicio)} a {horaTexto(j.fin)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <MapPinIcon size={18} color={fg} />
            <Text variant="body" className="flex-1 text-menta-ink">
              {j.lugar}
              {j.barrio ? ` · ${j.barrio}` : ''}
            </Text>
          </View>
          {j.descripcion ? (
            <Text variant="body" className="text-menta-ink">
              {j.descripcion}
            </Text>
          ) : null}
          {conPunto ? (
            <View className="mt-1 flex-row flex-wrap gap-2">
              <Accion
                label="Ver en el mapa"
                icon={MapTrifoldIcon}
                onPress={() => router.push({ pathname: '/mapa', params: { jornada: j.id } })}
                accessibilityLabel={`Ver ${j.titulo} en el mapa`}
              />
              <Accion
                label="Cómo llegar"
                icon={NavigationArrowIcon}
                onPress={() => comoLlegar({ latitud: j.latitud!, longitud: j.longitud! }, j.lugar)}
                accessibilityHint="Abre la app de mapas del teléfono con la ruta"
              />
            </View>
          ) : null}
        </Tile>
      </Aparecer>

      <Aparecer orden={2} className="gap-3">
        <RegistroRapido jornada={j} lleno={inscritos >= j.cupos} />
      </Aparecer>

      <Aparecer orden={3} className="gap-3">
        <Seccion titulo="Asistentes" detalle={asistentes.data ? plural(lista.length, '1 registrado', `${lista.length} registrados`) : undefined} />
        {asistentes.data && lista.length === 0 ? (
          <EmptyState title="Aún no hay asistentes" body="Regístralos durante la jornada; cada nombre aparece aquí al instante." />
        ) : null}
        {/* Los que ya estaban no se animan al abrir; solo los que se registran después. */}
        <LayoutAnimationConfig skipEntering>
          <View>
            {lista.map((a) => (
              <AsistenteItem key={a.id} asistente={a} jornada={j} />
            ))}
          </View>
        </LayoutAnimationConfig>
      </Aparecer>
    </PantallaDetalle>
  );
}

/* ---------- Registro rápido (HU-21, RN-08) ---------- */

function RegistroRapido({ jornada, lleno }: { jornada: JornadaConInscritos; lleno: boolean }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [seguimiento, setSeguimiento] = useState(false);
  const [autoriza, setAutoriza] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const nombreRef = useRef<ComponentRef<typeof TextInput>>(null);
  const telefonoRef = useRef<ComponentRef<typeof TextInput>>(null);
  const { registrar } = useRegistrarAsistente();

  const errorNombre = !nombre.trim() ? 'Escribe el nombre.' : undefined;
  const fechaSeguimiento = diaMes(fechaSeguimientoAsistente(jornada.inicio, hoyClave()));

  const agregar = () => {
    setIntentado(true);
    if (errorNombre) return;
    const datos = { nombre, telefono, requiereSeguimiento: seguimiento, consentimientoDatos: autoriza };
    // La fila aparece al instante (actualización optimista); el formulario queda listo para el siguiente.
    registrar(jornada, datos)
      .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
      .catch(avisarError('No se pudo registrar el asistente'));
    setNombre('');
    setTelefono('');
    setSeguimiento(false);
    setAutoriza(false);
    setIntentado(false);
    nombreRef.current?.focus();
  };

  return (
    <>
      <Seccion titulo="Registrar asistente" detalle={lleno ? 'Cupos completos; puedes seguir registrando.' : undefined} />
      <View className="gap-3">
        <Field
          ref={nombreRef}
          label="Nombre"
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
          autoComplete="off"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => telefonoRef.current?.focus()}
          error={intentado ? errorNombre : undefined}
        />
        <Field
          ref={telefonoRef}
          label="Teléfono (opcional)"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="off"
          returnKeyType="done"
        />
        <ToggleRow
          label="Requiere seguimiento"
          description={`Se programa una llamada para el ${fechaSeguimiento}.`}
          value={seguimiento}
          onChange={setSeguimiento}
        />
        <ToggleRow
          label="Autoriza datos"
          description="Acepta el tratamiento de sus datos personales (Ley 1581 de 2012)."
          value={autoriza}
          onChange={setAutoriza}
        />
        <Button label="Agregar a la lista" icon={<UserPlusIcon size={20} color={color.onAccent} />} onPress={agregar} />
      </View>
    </>
  );
}

/* ---------- Asistente ---------- */

// Un asistente nuevo entra desde arriba; los demás bajan con resorte para hacerle sitio.
const entrada = FadeInDown.springify().damping(18).stiffness(190).reduceMotion(ReduceMotion.System);
const reacomodo = LinearTransition.springify().damping(20).reduceMotion(ReduceMotion.System);

function AsistenteItem({ asistente: a, jornada }: { asistente: Asistente; jornada: JornadaConInscritos }) {
  const { convertir, vincular, guardando } = useConvertirEnPaciente();
  const eliminar = useEliminarAsistente();

  const abrirFicha = (pacienteId: string) => router.push({ pathname: '/paciente/[id]', params: { id: pacienteId } });

  const crearFicha = () => {
    convertir(a)
      .then((p) => abrirFicha(p.id))
      .catch(avisarError('No se pudo crear la ficha'));
  };

  const convertirEnPaciente = async () => {
    if (a.pacienteId) return abrirFicha(a.pacienteId);
    const existente = await buscarPacientePorTelefono(a.telefono).catch(() => null);
    if (existente) {
      Alert.alert('Ya está en tus pacientes', `${existente.nombre} tiene el mismo teléfono. ¿Quieres ligar este asistente a su ficha?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Crear otra ficha', onPress: crearFicha },
        {
          text: 'Ligar a su ficha',
          onPress: () =>
            vincular(a.id, existente.id)
              .then(() => abrirFicha(existente.id))
              .catch(avisarError('No se pudo ligar el asistente')),
        },
      ]);
      return;
    }
    Alert.alert(
      'Convertir en paciente',
      `Se crea la ficha de ${a.nombre} como persona afectada por el sismo, con tarifa social. Puedes ajustarla en su ficha.${
        a.consentimientoDatos ? '' : '\n\nAún no autoriza el tratamiento de datos; regístralo antes de guardar información clínica.'
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Crear ficha', onPress: crearFicha },
      ],
    );
  };

  const quitar = () => {
    Alert.alert('Quitar de la lista', `¿Quitar a ${a.nombre} de esta jornada? También se borra su seguimiento.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => eliminar.mutate(a.id, { onError: avisarError('No se pudo quitar') }),
      },
    ]);
  };

  const detalles = [
    a.telefono ? formatoTelefono(a.telefono) : 'Sin teléfono',
    a.requiereSeguimiento ? 'Con seguimiento' : null,
    a.pacienteId ? 'Ya es paciente' : null,
    a.consentimientoDatos ? null : 'Sin autorización de datos',
  ].filter(Boolean);

  return (
    <Animated.View
      entering={entrada}
      exiting={FadeOut.duration(180).reduceMotion(ReduceMotion.System)}
      layout={reacomodo}
      className="gap-2 py-3">
      <View className="flex-1">
        <Text variant="bodyMedium">{a.nombre}</Text>
        <Text variant="caption" className="text-ink-soft">
          {detalles.join(' · ')}
        </Text>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        {a.telefono ? (
          <Accion label="Llamar" icon={PhoneIcon} onPress={() => llamarA(a.telefono)} accessibilityLabel={`Llamar a ${a.nombre}`} />
        ) : null}
        <Accion
          label={a.pacienteId ? 'Ver ficha' : 'Convertir en paciente'}
          icon={IdentificationCardIcon}
          onPress={() => void convertirEnPaciente()}
          disabled={guardando}
          accessibilityLabel={a.pacienteId ? `Ver la ficha de ${a.nombre}` : `Convertir a ${a.nombre} en paciente`}
        />
        <BotonIcono
          icon={TrashIcon}
          label={`Quitar a ${a.nombre} de la jornada ${jornada.titulo}`}
          tone={color.inkSoft}
          onPress={quitar}
          disabled={eliminar.isPending}
        />
      </View>
    </Animated.View>
  );
}
