import { router } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePacientes } from '@/data/hooks';
import type { Paciente } from '@/domain/types';
import { fechaCorta } from '@/lib/dates';
import { iniciales } from '@/lib/format';
import { color, font, radius, space, tabBarInset, tile } from '@/theme';
import { EmptyState, Segmented, SolidarioMark, Text, TraceLine } from '@/ui';

import { useResumenCitasPacientes } from './hooks';
import type { ResumenCitas } from './repo';
import { existeNombre, filtrarPacientes, FILTROS, type FiltroLista } from './rules';

const VACIOS: Record<FiltroLista, { title: string; body: string }> = {
  todos: { title: 'Aún no hay pacientes', body: 'Escribe un nombre en el buscador para crear el primero.' },
  afectados: {
    title: 'Nadie marcado como afectado',
    body: 'Activa «Afectado por el sismo» al crear o editar un paciente y aparecerá aquí.',
  },
  archivados: { title: 'No hay pacientes archivados', body: 'Al archivar un paciente su historia se conserva y queda aquí.' },
};

function textoCita(p: Paciente, resumen?: ResumenCitas) {
  if (p.archivadoEn) return `Archivado el ${fechaCorta(p.archivadoEn)}`;
  if (resumen?.proxima) return `Próxima cita: ${fechaCorta(resumen.proxima)}`;
  if (resumen?.ultima) return `Última cita: ${fechaCorta(resumen.ultima)}`;
  return 'Sin citas';
}

/** Pestaña Pacientes (HU-08): el buscador también crea; si nadie se llama así, ofrece crearlo. */
export function PacientesScreen() {
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<FiltroLista>('todos');
  const pacientes = usePacientes({ incluirArchivados: true });
  const { data: resumen } = useResumenCitasPacientes();

  const todos = pacientes.data ?? [];
  const texto = consulta.trim().replace(/\s+/g, ' ');
  const visibles = filtrarPacientes(todos, filtro, texto);
  const activos = todos.filter((p) => !p.archivadoEn).length;
  const puedeCrear = texto.length >= 2 && filtro !== 'archivados' && !existeNombre(todos, texto);
  const enArchivados = filtro !== 'archivados' && texto ? filtrarPacientes(todos, 'archivados', texto).length : 0;

  const crear = () => router.push({ pathname: '/paciente/nuevo', params: { nombre: texto } });
  const abrir = (id: string) => router.push({ pathname: '/paciente/[id]', params: { id } });

  const alEnviar = () => {
    const unico = visibles.length === 1 ? visibles[0] : undefined;
    if (unico) abrir(unico.id);
    else if (puedeCrear && visibles.length === 0) crear();
  };

  const vacio = pacientes.isPending ? (
    <TraceLine height={40} />
  ) : texto ? (
    <Text variant="body" tone={color.inkSoft} style={styles.sinCoincidencias}>
      {puedeCrear ? 'Nadie se llama así todavía.' : 'Sin coincidencias en esta lista.'}
    </Text>
  ) : (
    <EmptyState {...VACIOS[filtro]} />
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.encabezado}>
        <View style={styles.tituloFila}>
          <Text variant="display" accessibilityRole="header">
            Pacientes
          </Text>
          {pacientes.data ? (
            <Text variant="caption" tone={color.inkSoft}>
              {activos === 1 ? '1 activo' : `${activos} activos`}
            </Text>
          ) : null}
        </View>

        <View style={styles.buscador}>
          <MagnifyingGlassIcon size={20} color={color.inkSoft} />
          <TextInput
            value={consulta}
            onChangeText={setConsulta}
            onSubmitEditing={alEnviar}
            placeholder="Buscar o escribir un nombre nuevo"
            placeholderTextColor={color.inkSoft}
            accessibilityLabel="Buscar paciente o escribir un nombre nuevo"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.entrada}
          />
          {consulta ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              hitSlop={12}
              onPress={() => setConsulta('')}
              style={styles.borrar}>
              <XIcon size={14} color={color.ink} />
            </Pressable>
          ) : null}
        </View>

        <Segmented options={FILTROS} value={filtro} onChange={setFiltro} accessibilityLabel="Filtro de pacientes" />
      </View>

      <FlatList
        data={visibles}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          puedeCrear || enArchivados > 0 ? (
            <View style={styles.cabezaLista}>
              {puedeCrear ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Crear paciente ${texto}`}
                  onPress={crear}
                  style={({ pressed }) => [styles.crear, pressed && styles.pressed]}>
                  <View style={styles.crearIcono}>
                    <PlusIcon size={18} color={color.onAccent} weight="bold" />
                  </View>
                  <Text variant="bodyMedium" tone={color.accent} style={styles.flex} numberOfLines={2}>
                    Crear paciente «{texto}»
                  </Text>
                </Pressable>
              ) : null}
              {enArchivados > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setFiltro('archivados')}
                  hitSlop={8}
                  style={({ pressed }) => [styles.enlace, pressed && styles.pressed]}>
                  <Text variant="label" tone={color.accent}>
                    {enArchivados === 1 ? 'Hay 1 coincidencia en Archivados' : `Hay ${enArchivados} coincidencias en Archivados`}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : undefined
        }
        ListEmptyComponent={vacio}
        renderItem={({ item, index }) => (
          <FilaPaciente
            paciente={item}
            detalle={textoCita(item, resumen?.[item.id])}
            ultima={index === visibles.length - 1}
            onPress={() => abrir(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function FilaPaciente({
  paciente: p,
  detalle,
  ultima,
  onPress,
}: {
  paciente: Paciente;
  detalle: string;
  ultima: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${p.nombre}. ${detalle}${p.afectadoSismo ? '. Afectado por el sismo' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.fila, !ultima && styles.divisor, pressed && styles.pressed]}>
      <View style={[styles.avatar, p.archivadoEn ? styles.avatarArchivado : null]}>
        <Text variant="label" tone={p.archivadoEn ? color.inkSoft : tile.consulta.fg}>
          {iniciales(p.nombre)}
        </Text>
      </View>
      <View style={styles.filaTexto}>
        <View style={styles.nombreFila}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.nombre}>
            {p.nombre}
          </Text>
          {p.afectadoSismo ? <SolidarioMark /> : null}
        </View>
        <Text variant="caption" tone={color.inkSoft} numberOfLines={1}>
          {detalle}
        </Text>
      </View>
      <CaretRightIcon size={16} color={color.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  encabezado: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.sm, gap: space.md },
  tituloFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 50,
    paddingHorizontal: space.lg,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  entrada: { flex: 1, paddingVertical: space.md, fontFamily: font.body, fontSize: 16, color: color.ink },
  borrar: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: color.quiet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: { paddingHorizontal: space.xl, paddingBottom: tabBarInset + space.xxl },
  cabezaLista: { gap: space.sm, paddingTop: space.xs, paddingBottom: space.sm },
  crear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.accent,
  },
  crearIcono: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enlace: { alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' },
  flex: { flex: 1 },
  sinCoincidencias: { paddingVertical: space.lg },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 64, paddingVertical: space.md },
  divisor: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  pressed: { opacity: 0.6 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: tile.consulta.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarArchivado: { backgroundColor: color.quiet },
  filaTexto: { flex: 1, gap: 2 },
  nombreFila: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  nombre: { flexShrink: 1 },
});
