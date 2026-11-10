import { router } from 'expo-router';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePacientes } from '@/data/hooks';
import type { Paciente } from '@/domain/types';
import { fechaCorta } from '@/lib/dates';
import { abrirWhatsApp } from '@/lib/whatsapp';
import { color, tabBarInset } from '@/theme';
import { Aparecer, EmptyState, Presionable, Segmented, Text, TraceLine } from '@/ui';

import { FilaPaciente } from './fila-paciente';
import { useResumenCitasPacientes } from './hooks';
import type { ResumenCitas } from './repo';
import { existeNombre, filtrarPacientes, FILTROS, saludoWhatsApp, type FiltroLista } from './rules';
import { usePacientesStore } from './store';

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

const abrir = (id: string) => router.push({ pathname: '/paciente/[id]', params: { id } });
const agendar = (id: string) => router.push({ pathname: '/cita/nueva', params: { pacienteId: id } });
const escribir = (p: Paciente) => {
  if (!p.telefono) return;
  abrirWhatsApp(p.telefono, saludoWhatsApp(p.nombre)).catch(() =>
    Alert.alert('No se pudo abrir WhatsApp', 'Revisa el número en la ficha del paciente.'),
  );
};

/**
 * Pestaña Pacientes (HU-08): el buscador también crea; si nadie se llama así, ofrece crearlo.
 * La búsqueda y el filtro viven en Zustand para conservarse al ir a una ficha y volver.
 */
export function PacientesScreen() {
  const consulta = usePacientesStore((s) => s.consulta);
  const filtro = usePacientesStore((s) => s.filtro);
  const setConsulta = usePacientesStore((s) => s.setConsulta);
  const setFiltro = usePacientesStore((s) => s.setFiltro);
  const pacientes = usePacientes({ incluirArchivados: true });
  const { data: resumen } = useResumenCitasPacientes();

  const todos = pacientes.data ?? [];
  const texto = consulta.trim().replace(/\s+/g, ' ');
  const visibles = filtrarPacientes(todos, filtro, texto);
  const activos = todos.filter((p) => !p.archivadoEn).length;
  const puedeCrear = texto.length >= 2 && filtro !== 'archivados' && !existeNombre(todos, texto);
  const enArchivados = filtro !== 'archivados' && texto ? filtrarPacientes(todos, 'archivados', texto).length : 0;

  const crear = () => router.push({ pathname: '/paciente/nuevo', params: { nombre: texto } });

  const alEnviar = () => {
    const unico = visibles.length === 1 ? visibles[0] : undefined;
    if (unico) abrir(unico.id);
    else if (puedeCrear && visibles.length === 0) crear();
  };

  return (
    // GestureHandlerRootView no acepta className: es el único estilo fijo en línea de la pantalla.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        <View className="gap-3 px-5 pb-2 pt-4">
          <Aparecer className="flex-row items-baseline justify-between">
            <Text variant="display" accessibilityRole="header">
              Pacientes
            </Text>
            {pacientes.data ? (
              <Text variant="caption" className="text-ink-soft">
                {activos === 1 ? '1 activo' : `${activos} activos`}
              </Text>
            ) : null}
          </Aparecer>

          <Aparecer orden={1} className="min-h-[50px] flex-row items-center gap-2 rounded-field border border-line bg-surface px-4">
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
              className="flex-1 py-3 font-body text-[16px] text-ink"
            />
            {consulta ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Borrar búsqueda"
                hitSlop={12}
                onPress={() => setConsulta('')}
                className="h-6 w-6 items-center justify-center rounded-full bg-quiet active:opacity-60">
                <XIcon size={14} color={color.ink} />
              </Pressable>
            ) : null}
          </Aparecer>

          <Aparecer orden={2}>
            <Segmented options={FILTROS} value={filtro} onChange={setFiltro} accessibilityLabel="Filtro de pacientes" />
          </Aparecer>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5"
          contentContainerStyle={{ paddingBottom: tabBarInset + 24 }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {puedeCrear ? (
            <Aparecer key="crear" reacomodar className="pb-2 pt-1">
              <Presionable
                accessibilityRole="button"
                accessibilityLabel={`Crear paciente ${texto}`}
                onPress={crear}
                contentClassName="min-h-[56px] flex-row items-center gap-3 rounded-tile border border-dashed border-accent px-3 py-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <PlusIcon size={18} color={color.onAccent} weight="bold" />
                </View>
                <Text variant="bodyMedium" numberOfLines={2} className="flex-1 text-accent">
                  Crear paciente «{texto}»
                </Text>
              </Presionable>
            </Aparecer>
          ) : null}

          {enArchivados > 0 ? (
            <Aparecer key="archivados" reacomodar>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFiltro('archivados')}
                className="min-h-[44px] justify-center self-start active:opacity-60">
                <Text variant="label" className="text-accent">
                  {enArchivados === 1 ? 'Hay 1 coincidencia en Archivados' : `Hay ${enArchivados} coincidencias en Archivados`}
                </Text>
              </Pressable>
            </Aparecer>
          ) : null}

          {visibles.map((p, i) => (
            // La cascada es solo para la primera carga: al buscar o filtrar, las filas que vuelven entran de inmediato.
            <Aparecer key={p.id} orden={texto || filtro !== 'todos' ? 0 : i + 3} reacomodar>
              <FilaPaciente
                paciente={p}
                detalle={textoCita(p, resumen?.[p.id])}
                ultima={i === visibles.length - 1}
                onAbrir={() => abrir(p.id)}
                onWhatsApp={p.telefono && !p.archivadoEn ? () => escribir(p) : undefined}
                onAgendar={p.archivadoEn ? undefined : () => agendar(p.id)}
              />
            </Aparecer>
          ))}

          {visibles.length === 0 ? (
            <Aparecer key={`vacio-${filtro}-${texto ? 'busqueda' : 'lista'}`} orden={3} reacomodar>
              {pacientes.isPending ? (
                <TraceLine height={40} />
              ) : texto ? (
                <Text variant="body" className="py-4 text-ink-soft">
                  {puedeCrear ? 'Nadie se llama así todavía.' : 'Sin coincidencias en esta lista.'}
                </Text>
              ) : (
                <EmptyState {...VACIOS[filtro]} />
              )}
            </Aparecer>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
