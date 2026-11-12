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
import { ActivityIndicator, Alert, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import {
  useActualizarSeguimiento,
  useCitasPaciente,
  useConsultorio,
  useCrearSeguimiento,
  usePaciente,
  useSeguimientos,
} from '@/data/hooks';
import type { Paciente } from '@/domain/types';
import { useJornadasDePaciente } from '@/features/solidario/hooks';
import { cn } from '@/lib/cn';
import { fechaCorta, hoyClave, isoDesde, sumarDias } from '@/lib/dates';
import { formatoTelefono } from '@/lib/format';
import { abrirWhatsApp, llamar } from '@/lib/whatsapp';
import { color, tile } from '@/theme';
import { Aparecer, Button, EmptyState, HatchOverlay, Presionable, Text, Tile, TraceLine } from '@/ui';

import { AgregarHistoria } from './agregar-historia';
import { AsistenciaTira } from './asistencia-tira';
import { construirHistoria, resumirAsistencia, type ItemHistoria } from './historia';
import { HistoriaLinea } from './historia-linea';
import { useArchivarPaciente, useConsentimientos, useNotasPaciente, usePagosPaciente } from './hooks';
import { MenuAcciones } from './menu-acciones';
import { exportarResumenPdf } from './resumen-pdf';
import { etiquetaTarifa, etiquetasAfectaciones, saludoWhatsApp } from './rules';

const MOTIVO_SEGUIMIENTO = 'Llamar para saber cómo sigue';
/** Alto del encabezado grande mientras no se ha medido. */
const ALTO_CABECERA = 230;

/**
 * Ficha del paciente (HU-09): encabezado lavanda que se encoge al hacer scroll
 * (el nombre y las acciones pasan a la barra compacta), asistencia de un vistazo y la historia.
 */
export function FichaPacienteScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const paciente = usePaciente(id);
  const citas = useCitasPaciente(id);
  const pagos = usePagosPaciente(id);
  const notas = useNotasPaciente(id);
  const seguimientos = useSeguimientos({ pacienteId: id });
  const consentimientos = useConsentimientos(id);
  const jornadas = useJornadasDePaciente(id);
  const { data: consultorio } = useConsultorio();
  const archivar = useArchivarPaciente();
  const crearSeguimiento = useCrearSeguimiento();
  const actualizarSeguimiento = useActualizarSeguimiento();
  const [menu, setMenu] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  /** La barra compacta ya muestra el nombre y las acciones (para activar sus toques y su lectura). */
  const [compacta, setCompacta] = useState(false);

  const desplazamiento = useSharedValue(0);
  const altoCabecera = useSharedValue(ALTO_CABECERA);
  const alDesplazar = useAnimatedScrollHandler((e) => {
    desplazamiento.set(e.contentOffset.y);
  });

  useAnimatedReaction(
    () => desplazamiento.get() > altoCabecera.get() * 0.6,
    (ahora, antes) => {
      if (ahora !== antes) scheduleOnRN(setCompacta, ahora);
    },
  );

  // El encabezado grande se encoge y se desvanece; la barra compacta aparece en su lugar.
  const estiloCabecera = useAnimatedStyle(() => {
    const fin = altoCabecera.get() * 0.8;
    return {
      opacity: interpolate(desplazamiento.get(), [0, fin], [1, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(desplazamiento.get(), [0, fin], [1, 0.94], Extrapolation.CLAMP) }],
    };
  });
  const estiloFondoBarra = useAnimatedStyle(() => ({
    opacity: interpolate(desplazamiento.get(), [altoCabecera.get() * 0.35, altoCabecera.get() * 0.7], [0, 1], Extrapolation.CLAMP),
  }));
  const estiloCompacto = useAnimatedStyle(() => {
    const rango = [altoCabecera.get() * 0.45, altoCabecera.get() * 0.8];
    return {
      opacity: interpolate(desplazamiento.get(), rango, [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(desplazamiento.get(), rango, [10, 0], Extrapolation.CLAMP) }],
    };
  });

  const p = paciente.data;
  const cargandoHistoria =
    citas.isPending || pagos.isPending || notas.isPending || seguimientos.isPending || consentimientos.isPending;
  const items = construirHistoria({
    citas: citas.data ?? [],
    pagos: pagos.data ?? [],
    notas: notas.data ?? [],
    seguimientos: seguimientos.data ?? [],
    consentimientos: consentimientos.data ?? [],
    jornadas: jornadas.data ?? [],
  });
  const asistencia = resumirAsistencia(citas.data ?? []);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/pacientes'));

  if (paciente.isPending || !p) {
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
        <View className="h-[52px] flex-row items-center px-3">
          <BotonIcono etiqueta="Volver" onPress={volver}>
            <CaretLeftIcon size={20} color={color.ink} />
          </BotonIcono>
        </View>
        <View className="px-5 pt-1">
          {paciente.isPending ? (
            <TraceLine height={40} />
          ) : (
            <EmptyState title="No encontramos a este paciente" body="Vuelve a la lista y búscalo por su nombre." />
          )}
        </View>
      </View>
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
  const agendar = () => router.push({ pathname: '/cita/nueva', params: { pacienteId: p.id } });

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
    } else if (item.tipo === 'jornada' && item.jornadaId) {
      router.push({ pathname: '/jornada/[id]', params: { id: item.jornadaId } });
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
    <View className="flex-1 bg-canvas">
      {/* Barra superior: al hacer scroll se tiñe de lavanda y recibe el nombre y las acciones. */}
      <View className="z-10" style={{ paddingTop: insets.top }}>
        <Animated.View pointerEvents="none" className="absolute inset-0 bg-lavanda" style={estiloFondoBarra} />
        <View className="h-[52px] flex-row items-center gap-1 px-3">
          <BotonIcono etiqueta="Volver" onPress={volver}>
            <CaretLeftIcon size={20} color={color.ink} />
          </BotonIcono>
          <Animated.View
            className="flex-1 flex-row items-center"
            style={estiloCompacto}
            pointerEvents={compacta ? 'auto' : 'none'}
            accessibilityElementsHidden={!compacta}
            importantForAccessibility={compacta ? 'auto' : 'no-hide-descendants'}>
            <Text variant="heading" numberOfLines={1} className="flex-1 pl-1 text-lavanda-ink">
              {p.nombre}
            </Text>
            <BotonIcono etiqueta="Escribir por WhatsApp" disabled={!conTelefono} onPress={() => contactar('whatsapp')}>
              <WhatsappLogoIcon size={20} color={tile.consulta.fg} />
            </BotonIcono>
            <BotonIcono etiqueta="Llamar" disabled={!conTelefono} onPress={() => contactar('llamar')}>
              <PhoneIcon size={20} color={tile.consulta.fg} />
            </BotonIcono>
            <BotonIcono etiqueta="Agendar cita" onPress={agendar}>
              <CalendarPlusIcon size={20} color={tile.consulta.fg} />
            </BotonIcono>
          </Animated.View>
          {exportando ? <ActivityIndicator color={color.ink} accessibilityLabel="Preparando el PDF" /> : null}
          <BotonIcono etiqueta="Más acciones" onPress={() => setMenu(true)}>
            <DotsThreeIcon size={22} color={color.ink} weight="bold" />
          </BotonIcono>
        </View>
      </View>

      <Animated.ScrollView onScroll={alDesplazar} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-5 pt-1" style={{ paddingBottom: insets.bottom + 32 }}>
          <Aparecer>
            <Animated.View style={estiloCabecera} onLayout={(e) => altoCabecera.set(e.nativeEvent.layout.height)}>
              <Tile tone="consulta" contentClassName="gap-3">
                <View className="gap-1">
                  <Text variant="display" className="text-lavanda-ink" accessibilityRole="header">
                    {p.nombre}
                  </Text>
                  <Text variant="mono" className="text-lavanda-ink">
                    {conTelefono ? formatoTelefono(p.telefono) : 'Sin celular'}
                  </Text>
                  {p.correo ? (
                    <Text variant="caption" className="text-lavanda-ink">
                      {p.correo}
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {p.afectadoSismo ? <ChipSismo paciente={p} /> : null}
                  <ChipPlano texto={etiquetaTarifa(p.tarifa)} />
                  {p.archivadoEn ? <ChipPlano texto="Archivado" /> : null}
                </View>

                <View className="flex-row gap-2">
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
                  <AccionPildora etiqueta="Agendar" icono={<CalendarPlusIcon size={18} color={tile.consulta.fg} />} onPress={agendar} />
                </View>
                {!conTelefono ? (
                  <Text variant="caption" className="text-lavanda-ink">
                    Agrega un celular en Editar para escribirle o llamarle.
                  </Text>
                ) : null}
              </Tile>
            </Animated.View>
          </Aparecer>

          {p.archivadoEn ? (
            <Aparecer orden={1} reacomodar className="flex-row items-center gap-3 rounded-field bg-quiet p-3">
              <ArchiveIcon size={18} color={color.inkSoft} />
              <Text variant="caption" className="flex-1 text-ink-soft">
                Archivado el {fechaCorta(p.archivadoEn)}. La historia se conserva.
              </Text>
              <Button label="Restaurar" size="sm" variant="secondary" loading={archivar.isPending} onPress={archivarORestaurar} />
            </Aparecer>
          ) : null}

          {asistencia.puntos.length ? (
            <Aparecer orden={1} reacomodar>
              <AsistenciaTira asistencia={asistencia} />
            </Aparecer>
          ) : null}

          {p.notasGenerales ? (
            <Aparecer orden={2} reacomodar className="gap-1 px-1">
              <Text variant="label" className="text-ink-soft">
                Notas generales
              </Text>
              <Text variant="body">{p.notasGenerales}</Text>
            </Aparecer>
          ) : null}

          <Aparecer orden={3} reacomodar className="mt-3">
            <Text variant="heading" accessibilityRole="header">
              Historia
            </Text>
          </Aparecer>

          {cargandoHistoria ? (
            <TraceLine height={32} />
          ) : items.length ? (
            <HistoriaLinea items={items} onPressItem={abrirItem} onAbrirNota={abrirNotaDeCita} ordenInicial={4} />
          ) : (
            <EmptyState title="La historia empieza aquí" body="Agenda la primera cita o programa un seguimiento." />
          )}

          <AgregarHistoria
            onAgendar={agendar}
            onNota={() => router.push({ pathname: '/nota/[id]', params: { id: 'nueva', pacienteId: p.id } })}
            onSeguimiento={nuevoSeguimiento}
          />
          {aviso ? (
            <Text variant="caption" className="text-center text-ink-soft" accessibilityLiveRegion="polite">
              {aviso}
            </Text>
          ) : null}
        </View>
      </Animated.ScrollView>

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
    </View>
  );
}

function BotonIcono({
  etiqueta,
  onPress,
  disabled,
  children,
}: {
  etiqueta: string;
  onPress: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={disabled ? 'Sin celular registrado' : undefined}
      disabled={disabled}
      onPress={onPress}
      contentClassName={cn('h-11 w-11 items-center justify-center rounded-full', disabled && 'opacity-40')}>
      {children}
    </Presionable>
  );
}

function ChipSismo({ paciente }: { paciente: Paciente }) {
  const tipos = etiquetasAfectaciones(paciente.afectaciones);
  return (
    <View className="overflow-hidden rounded-full bg-durazno px-3 py-1">
      <HatchOverlay color={tile.solidario.fg} />
      <Text variant="label" className="text-durazno-ink">
        {tipos ? `Sismo · ${tipos}` : 'Afectación por el sismo'}
      </Text>
    </View>
  );
}

function ChipPlano({ texto }: { texto: string }) {
  return (
    <View className="rounded-full bg-surface px-3 py-1">
      <Text variant="label" className="text-lavanda-ink">
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
    <Presionable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={disabled ? 'Sin celular registrado' : undefined}
      disabled={disabled}
      onPress={onPress}
      className="flex-1"
      contentClassName={cn(
        'min-h-[44px] flex-row items-center justify-center gap-1.5 rounded-full px-2',
        principal ? 'bg-accent' : 'bg-surface',
        disabled && 'opacity-50',
      )}>
      {icono}
      <Text variant="label" numberOfLines={1} className={principal ? 'text-accent-on' : 'text-lavanda-ink'}>
        {etiqueta}
      </Text>
    </Presionable>
  );
}
