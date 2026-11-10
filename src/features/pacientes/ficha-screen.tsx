import { router } from 'expo-router';
import { ArchiveIcon } from 'phosphor-react-native/src/icons/Archive';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { CalendarPlusIcon } from 'phosphor-react-native/src/icons/CalendarPlus';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { DotsThreeIcon } from 'phosphor-react-native/src/icons/DotsThree';
import { FilePdfIcon } from 'phosphor-react-native/src/icons/FilePdf';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { WhatsappLogoIcon } from 'phosphor-react-native/src/icons/WhatsappLogo';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useActualizarSeguimiento,
  useCitasPaciente,
  useConsultorio,
  useCrearSeguimiento,
  usePaciente,
  useSeguimientos,
} from '@/data/hooks';
import type { Paciente } from '@/domain/types';
import { fechaCorta, hoyClave, isoDesde, sumarDias } from '@/lib/dates';
import { formatoTelefono } from '@/lib/format';
import { abrirWhatsApp, llamar } from '@/lib/whatsapp';
import { color, radius, space, tile } from '@/theme';
import { Button, EmptyState, HatchOverlay, Text, Tile, TraceLine } from '@/ui';

import { AgregarHistoria } from './agregar-historia';
import { construirHistoria, type ItemHistoria } from './historia';
import { HistoriaLinea } from './historia-linea';
import { useArchivarPaciente, useConsentimientos, useNotasPaciente, usePagosPaciente } from './hooks';
import { MenuAcciones } from './menu-acciones';
import { exportarResumenPdf } from './resumen-pdf';
import { etiquetaTarifa, etiquetasAfectaciones, saludoWhatsApp } from './rules';

const MOTIVO_SEGUIMIENTO = 'Llamar para saber cómo sigue';

/** Ficha del paciente (HU-09): encabezado con acciones y la historia como línea de tiempo. */
export function FichaPacienteScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const paciente = usePaciente(id);
  const citas = useCitasPaciente(id);
  const pagos = usePagosPaciente(id);
  const notas = useNotasPaciente(id);
  const seguimientos = useSeguimientos({ pacienteId: id });
  const consentimientos = useConsentimientos(id);
  const { data: consultorio } = useConsultorio();
  const archivar = useArchivarPaciente();
  const crearSeguimiento = useCrearSeguimiento();
  const actualizarSeguimiento = useActualizarSeguimiento();
  const [menu, setMenu] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const p = paciente.data;
  const cargandoHistoria =
    citas.isPending || pagos.isPending || notas.isPending || seguimientos.isPending || consentimientos.isPending;
  const items = construirHistoria({
    citas: citas.data ?? [],
    pagos: pagos.data ?? [],
    notas: notas.data ?? [],
    seguimientos: seguimientos.data ?? [],
    consentimientos: consentimientos.data ?? [],
  });

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/pacientes'));

  const barra = (
    <View style={styles.barra}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={volver} style={styles.botonIcono}>
        <CaretLeftIcon size={20} color={color.ink} />
      </Pressable>
      <View style={styles.barraDerecha}>
        {exportando ? <ActivityIndicator color={color.ink} accessibilityLabel="Preparando el PDF" /> : null}
        {p ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Más acciones" onPress={() => setMenu(true)} style={styles.botonIcono}>
            <DotsThreeIcon size={22} color={color.ink} weight="bold" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  if (paciente.isPending || !p) {
    return (
      <SafeAreaView edges={['top']} style={styles.root}>
        {barra}
        <View style={styles.contenido}>
          {paciente.isPending ? (
            <TraceLine height={40} />
          ) : (
            <EmptyState title="No encontramos a este paciente" body="Vuelve a la lista y búscalo por su nombre." />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const conTelefono = !!p.telefono;

  const contactar = (accion: 'whatsapp' | 'llamar') => {
    if (!p.telefono) return;
    const intento = accion === 'whatsapp' ? abrirWhatsApp(p.telefono, saludoWhatsApp(p.nombre)) : llamar(p.telefono);
    intento.catch(() =>
      Alert.alert(accion === 'whatsapp' ? 'No se pudo abrir WhatsApp' : 'No se pudo iniciar la llamada', 'Revisa el número en Editar.'),
    );
  };

  const archivarORestaurar = () => {
    if (p.archivadoEn) {
      archivar.mutate({ id: p.id, archivar: false });
      return;
    }
    Alert.alert(
      `¿Archivar a ${p.nombre}?`,
      'Sale de la lista de pacientes activos. No se borra nada: la historia se conserva y puedes restaurar la ficha desde Archivados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Archivar', style: 'destructive', onPress: () => archivar.mutate({ id: p.id, archivar: true }) },
      ],
    );
  };

  const exportar = async () => {
    setExportando(true);
    try {
      await exportarResumenPdf({
        paciente: p,
        citas: citas.data ?? [],
        pagos: pagos.data ?? [],
        consentimientos: consentimientos.data ?? [],
        consultorio: consultorio ?? null,
      });
    } catch (e) {
      Alert.alert('No se pudo exportar el resumen', e instanceof Error ? e.message : 'Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  const nuevoSeguimiento = () => {
    const fecha = sumarDias(hoyClave(), 7);
    crearSeguimiento.mutate(
      { nombre: p.nombre, telefono: p.telefono, fechaObjetivo: fecha, motivo: MOTIVO_SEGUIMIENTO, pacienteId: p.id },
      {
        onSuccess: () => setAviso(`Seguimiento agendado para el ${fechaCorta(isoDesde(fecha))}.`),
        onError: () => Alert.alert('No se pudo crear el seguimiento', 'Intenta de nuevo.'),
      },
    );
  };

  const abrirItem = (item: ItemHistoria) => {
    if (item.tipo === 'cita' && item.citaId) {
      router.push({ pathname: '/cita/[id]', params: { id: item.citaId } });
    } else if (item.tipo === 'nota' && item.notaId) {
      router.push({ pathname: '/nota/[id]', params: { id: item.notaId } });
    } else if (item.tipo === 'seguimiento' && item.seguimientoId) {
      const segId = item.seguimientoId;
      Alert.alert('Seguimiento', item.detalle, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => actualizarSeguimiento.mutate({ id: segId, cambios: { estado: 'descartado' } }) },
        { text: 'Marcar como hecho', onPress: () => actualizarSeguimiento.mutate({ id: segId, cambios: { estado: 'hecho' } }) },
      ]);
    }
  };

  const abrirNotaDeCita = (item: ItemHistoria) => {
    if (item.citaId) router.push({ pathname: '/nota/[id]', params: { id: item.citaId } });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {barra}
      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + space.xxxl }]}
        showsVerticalScrollIndicator={false}>
        <Tile tone="consulta" contentStyle={styles.cabecera}>
          <View style={styles.identidad}>
            <Text variant="display" tone={tile.consulta.fg} accessibilityRole="header">
              {p.nombre}
            </Text>
            <Text variant="mono" tone={tile.consulta.fg}>
              {conTelefono ? formatoTelefono(p.telefono) : 'Sin celular'}
            </Text>
            {p.correo ? (
              <Text variant="caption" tone={tile.consulta.fg}>
                {p.correo}
              </Text>
            ) : null}
          </View>

          <View style={styles.chips}>
            {p.afectadoSismo ? <ChipSismo paciente={p} /> : null}
            <ChipPlano texto={etiquetaTarifa(p.tarifa)} />
            {p.archivadoEn ? <ChipPlano texto="Archivado" /> : null}
          </View>

          <View style={styles.acciones}>
            <AccionPildora
              principal
              etiqueta="WhatsApp"
              icono={<WhatsappLogoIcon size={18} color={color.onAccent} />}
              disabled={!conTelefono}
              onPress={() => contactar('whatsapp')}
            />
            <AccionPildora
              etiqueta="Llamar"
              icono={<PhoneIcon size={18} color={tile.consulta.fg} />}
              disabled={!conTelefono}
              onPress={() => contactar('llamar')}
            />
            <AccionPildora
              etiqueta="Agendar"
              icono={<CalendarPlusIcon size={18} color={tile.consulta.fg} />}
              onPress={() => router.push({ pathname: '/cita/nueva', params: { pacienteId: p.id } })}
            />
          </View>
          {!conTelefono ? (
            <Text variant="caption" tone={tile.consulta.fg}>
              Agrega un celular en Editar para escribirle o llamarle.
            </Text>
          ) : null}
        </Tile>

        {p.archivadoEn ? (
          <View style={styles.archivado}>
            <ArchiveIcon size={18} color={color.inkSoft} />
            <Text variant="caption" tone={color.inkSoft} style={styles.flex}>
              Archivado el {fechaCorta(p.archivadoEn)}. La historia se conserva.
            </Text>
            <Button label="Restaurar" size="sm" variant="secondary" loading={archivar.isPending} onPress={archivarORestaurar} />
          </View>
        ) : null}

        {p.notasGenerales ? (
          <View style={styles.notas}>
            <Text variant="label" tone={color.inkSoft}>
              Notas generales
            </Text>
            <Text variant="body">{p.notasGenerales}</Text>
          </View>
        ) : null}

        <Text variant="heading" accessibilityRole="header" style={styles.seccion}>
          Historia
        </Text>

        {cargandoHistoria ? (
          <TraceLine height={32} />
        ) : items.length ? (
          <HistoriaLinea items={items} onPressItem={abrirItem} onAbrirNota={abrirNotaDeCita} />
        ) : (
          <EmptyState title="La historia empieza aquí" body="Agenda la primera cita o programa un seguimiento." />
        )}

        <AgregarHistoria
          onAgendar={() => router.push({ pathname: '/cita/nueva', params: { pacienteId: p.id } })}
          onNota={() => router.push({ pathname: '/nota/[id]', params: { id: 'nueva', pacienteId: p.id } })}
          onSeguimiento={nuevoSeguimiento}
        />
        {aviso ? (
          <Text variant="caption" tone={color.inkSoft} accessibilityLiveRegion="polite" style={styles.aviso}>
            {aviso}
          </Text>
        ) : null}
      </ScrollView>

      <MenuAcciones
        visible={menu}
        onCerrar={() => setMenu(false)}
        acciones={[
          {
            etiqueta: 'Editar datos',
            icono: <PencilSimpleIcon size={20} color={color.ink} />,
            onPress: () => router.push({ pathname: '/paciente/nuevo', params: { id: p.id } }),
          },
          {
            etiqueta: 'Exportar resumen en PDF',
            icono: <FilePdfIcon size={20} color={color.ink} />,
            onPress: () => void exportar(),
          },
          p.archivadoEn
            ? {
                etiqueta: 'Restaurar paciente',
                icono: <ArrowCounterClockwiseIcon size={20} color={color.ink} />,
                onPress: archivarORestaurar,
              }
            : {
                etiqueta: 'Archivar paciente',
                icono: <ArchiveIcon size={20} color={color.ink} />,
                onPress: archivarORestaurar,
              },
        ]}
      />
    </SafeAreaView>
  );
}

function ChipSismo({ paciente }: { paciente: Paciente }) {
  const tipos = etiquetasAfectaciones(paciente.afectaciones);
  return (
    <View style={[styles.chip, styles.chipSismo]}>
      <HatchOverlay color={tile.solidario.fg} />
      <Text variant="label" tone={tile.solidario.fg}>
        {tipos ? `Sismo · ${tipos}` : 'Afectación por el sismo'}
      </Text>
    </View>
  );
}

function ChipPlano({ texto }: { texto: string }) {
  return (
    <View style={[styles.chip, styles.chipPlano]}>
      <Text variant="label" tone={tile.consulta.fg}>
        {texto}
      </Text>
    </View>
  );
}

function AccionPildora({
  etiqueta,
  icono,
  onPress,
  principal,
  disabled,
}: {
  etiqueta: string;
  icono: ReactNode;
  onPress: () => void;
  principal?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={disabled ? 'Sin celular registrado' : undefined}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pildora,
        principal ? styles.pildoraPrincipal : styles.pildoraSecundaria,
        pressed && styles.pressed,
        disabled && styles.inactiva,
      ]}>
      {icono}
      <Text variant="label" numberOfLines={1} tone={principal ? color.onAccent : tile.consulta.fg}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
  },
  barraDerecha: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  botonIcono: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: { paddingHorizontal: space.xl, paddingTop: space.xs, gap: space.md },
  cabecera: { gap: space.md },
  identidad: { gap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs, overflow: 'hidden' },
  chipSismo: { backgroundColor: tile.solidario.bg },
  chipPlano: { backgroundColor: color.surface },
  acciones: { flexDirection: 'row', gap: space.sm },
  pildora: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: space.sm,
  },
  pildoraPrincipal: { backgroundColor: color.accent },
  pildoraSecundaria: { backgroundColor: color.surface },
  pressed: { transform: [{ scale: 0.98 }] },
  inactiva: { opacity: 0.5 },
  archivado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.field,
    backgroundColor: color.quiet,
  },
  flex: { flex: 1 },
  notas: { gap: space.xs, paddingHorizontal: space.xs },
  seccion: { marginTop: space.md },
  aviso: { textAlign: 'center' },
});
