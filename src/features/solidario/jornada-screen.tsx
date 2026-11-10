import { router } from 'expo-router';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { IdentificationCardIcon } from 'phosphor-react-native/src/icons/IdentificationCard';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { useRef, useState, type ComponentRef } from 'react';
import { Alert, StyleSheet, View, type TextInput } from 'react-native';

import type { Asistente } from '@/domain/types';
import { fechaLarga, horaTexto, hoyClave } from '@/lib/dates';
import { formatoTelefono } from '@/lib/format';
import { color, space, tile } from '@/theme';
import { Button, EmptyState, Field, Text, Tile, ToggleRow } from '@/ui';

import { Accion, BotonIcono } from './components/accion';
import { PantallaDetalle } from './components/pantalla-detalle';
import { Seccion } from './components/seccion';
import { avisarError, llamarA } from './dispositivo';
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

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar jornada',
      `Se borran la jornada y su lista de ${plural(inscritos, '1 asistente', `${inscritos} asistentes`)}. Los seguimientos pendientes se conservan. Esto no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            eliminar.mutate(j.id, {
              onSuccess: () => (router.canGoBack() ? router.back() : router.replace('/solidario')),
              onError: avisarError('No se pudo eliminar la jornada'),
            }),
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
      <View style={styles.cabecera}>
        <Text variant="label" tone={color.inkSoft}>
          {etiquetaTipo(j.tipo)} · {capitalizar(fechaLarga(j.inicio))}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {j.titulo}
        </Text>
      </View>

      <Tile tone="confirmar" contentStyle={styles.datos}>
        <View style={styles.cupos} accessible accessibilityLabel={`${inscritos} de ${j.cupos} inscritos`}>
          <Text variant="number" tone={fg}>
            {inscritos} de {j.cupos}
          </Text>
          <Text variant="bodyMedium" tone={fg}>
            inscritos
          </Text>
        </View>
        <View style={styles.dato}>
          <ClockIcon size={18} color={fg} />
          <Text variant="body" tone={fg}>
            {horaTexto(j.inicio)} a {horaTexto(j.fin)}
          </Text>
        </View>
        <View style={styles.dato}>
          <MapPinIcon size={18} color={fg} />
          <Text variant="body" tone={fg} style={styles.flex}>
            {j.lugar}
            {j.barrio ? ` · ${j.barrio}` : ''}
          </Text>
        </View>
        {j.descripcion ? (
          <Text variant="body" tone={fg}>
            {j.descripcion}
          </Text>
        ) : null}
      </Tile>

      <RegistroRapido jornada={j} lleno={inscritos >= j.cupos} />

      <Seccion titulo="Asistentes" detalle={asistentes.data ? plural(lista.length, '1 registrado', `${lista.length} registrados`) : undefined} />
      {asistentes.data && lista.length === 0 ? (
        <EmptyState title="Aún no hay asistentes" body="Regístralos durante la jornada; cada nombre aparece aquí al instante." />
      ) : (
        <View>
          {lista.map((a, i) => (
            <AsistenteItem key={a.id} asistente={a} jornada={j} last={i === lista.length - 1} />
          ))}
        </View>
      )}
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
    registrar(jornada, datos).catch(avisarError('No se pudo registrar el asistente'));
    setNombre('');
    setTelefono('');
    setSeguimiento(false);
    setAutoriza(false);
    setIntentado(false);
    nombreRef.current?.focus();
  };

  return (
    <>
      <Seccion titulo="Registrar asistente" detalle={lleno ? 'Cupos completos; puedes seguir registrando.' : 'Nombre y teléfono, en segundos.'} />
      <View style={styles.formulario}>
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

function AsistenteItem({ asistente: a, jornada, last }: { asistente: Asistente; jornada: JornadaConInscritos; last: boolean }) {
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
    <View style={[styles.asistente, !last && styles.divisor]}>
      <View style={styles.flex}>
        <Text variant="bodyMedium">{a.nombre}</Text>
        <Text variant="caption" tone={color.inkSoft}>
          {detalles.join(' · ')}
        </Text>
      </View>
      <View style={styles.acciones}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: { gap: space.xs },
  datos: { gap: space.sm },
  cupos: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginBottom: space.xs },
  dato: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  formulario: { gap: space.md },
  asistente: { paddingVertical: space.md, gap: space.sm },
  divisor: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
});
