import { router } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { MapTrifoldIcon } from 'phosphor-react-native/src/icons/MapTrifold';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useConsultorio, useCuposSolidariosSemana, usePacientes, useSeguimientos } from '@/data/hooks';
import { AFECTACIONES, type Paciente } from '@/domain/types';
import { fechaClave, hoyClave, mesClave, mesTexto } from '@/lib/dates';
import { color, tile } from '@/theme';
import { Aparecer, EmptyState, ListRow, NumeroAnimado, Screen, SolidarioMark, Text, Tile } from '@/ui';

import { Accion } from './components/accion';
import { JornadaTile, TarjetaFantasma } from './components/jornada-tile';
import { MedidorCupos } from './components/medidor-cupos';
import { RecursoItem } from './components/recurso-item';
import { Seccion } from './components/seccion';
import { SeguimientoItem } from './components/seguimiento-item';
import { SismosRecientes } from './components/sismos-recientes';
import { compartirTexto } from './dispositivo';
import { useJornadas, useJornadasAnteriores, useJornadasProximas, useRecursos } from './hooks';
import type { JornadaConInscritos } from './repo';
import { capitalizar, diaMes, estadoCupos, masUrgentes, plural, textoDirectorio } from './rules';

const MAX_JORNADAS = 4;
const MAX_AFECTADOS = 4;

/** Pestaña Solidario: cupos de la semana, jornadas y su mapa, sismos, seguimientos, personas afectadas y líneas de ayuda. */
export function SolidarioScreen() {
  const hoy = hoyClave();

  return (
    // Raíz de gestos para las filas de seguimiento que se deslizan.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <Aparecer orden={0}>
          <Text variant="display" accessibilityRole="header">
            Solidario
          </Text>
          <Text variant="body" className="text-ink-soft">
            Programa post-sismo
          </Text>
        </Aparecer>

        <Aparecer orden={1}>
          <CuposHero />
        </Aparecer>
        <Aparecer orden={2} className="gap-3">
          <Jornadas />
        </Aparecer>
        <Aparecer orden={3} className="gap-3">
          <Seguimientos hoy={hoy} />
        </Aparecer>
        <Aparecer orden={4} className="gap-3">
          <SismosRecientes />
        </Aparecer>
        <Aparecer orden={5} className="gap-3">
          <Afectados />
        </Aparecer>
        <Aparecer orden={6} className="gap-3">
          <LineasDeAyuda />
        </Aparecer>
        <Aparecer orden={7}>
          <InformeEnlace />
        </Aparecer>
      </Screen>
    </GestureHandlerRootView>
  );
}

/* ---------- Cupos de la semana (HU-18, RN-03) ---------- */

function CuposHero() {
  const consultorio = useConsultorio();
  const usadosQ = useCuposSolidariosSemana();
  const total = consultorio.data?.cuposSolidariosSemana ?? 0;
  const usados = usadosQ.data ?? 0;
  const estado = estadoCupos(usados, total);

  return (
    <Tile
      tone="solidario"
      contentClassName="gap-2"
      onPress={() => router.push('/ajustes/cupos')}
      accessibilityLabel={`${usados} de ${total} cupos solidarios esta semana. ${estado.detalle} Toca para ajustar cupos y tarifa social.`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-baseline gap-2">
          <NumeroAnimado valor={usados} variant="number" className="text-durazno-ink" />
          <Text variant="title" className="text-durazno-ink">
            de {total}
          </Text>
        </View>
        <CaretRightIcon size={20} color={tile.solidario.fg} />
      </View>
      <Text variant="bodyMedium" className="text-durazno-ink">
        cupos solidarios esta semana
      </Text>
      <MedidorCupos usados={usados} total={total} />
      <Text variant="body" className="text-durazno-ink">
        {estado.detalle}
      </Text>
    </Tile>
  );
}

/* ---------- Jornadas (HU-20) y su mapa ---------- */

type Celda = { tipo: 'jornada'; jornada: JornadaConInscritos } | { tipo: 'nueva' };

/** Agrupa en filas de dos; la tarjeta "Programar jornada" siempre va al final. */
function enFilas(jornadas: JornadaConInscritos[]) {
  const celdas: Celda[] = [...jornadas.map((j): Celda => ({ tipo: 'jornada', jornada: j })), { tipo: 'nueva' }];
  const filas: Celda[][] = [];
  for (let i = 0; i < celdas.length; i += 2) filas.push(celdas.slice(i, i + 2));
  return filas;
}

function Jornadas() {
  const proximas = useJornadasProximas();
  const anteriores = useJornadasAnteriores(3);
  const lista = (proximas.data ?? []).slice(0, MAX_JORNADAS);
  const restantes = (proximas.data?.length ?? 0) - lista.length;
  const vacio = proximas.data && proximas.data.length === 0;

  return (
    <>
      <Seccion
        titulo="Próximas jornadas"
        detalle={restantes > 0 ? plural(restantes, 'Y 1 más programada', `Y ${restantes} más programadas`) : undefined}
      />
      {enFilas(lista).map((fila, i) => (
        <View key={i} className="flex-row gap-3">
          {fila.map((celda) =>
            celda.tipo === 'jornada' ? (
              <JornadaTile key={celda.jornada.id} jornada={celda.jornada} className="flex-1" />
            ) : (
              <TarjetaFantasma
                key="nueva"
                label="Programar jornada"
                detalle={vacio ? 'Taller, charla o atención grupal, con lugar y cupos.' : undefined}
                onPress={() => router.push('/jornada/nueva')}
                className="flex-1"
              />
            ),
          )}
        </View>
      ))}

      <MapaEntrada />

      {anteriores.data?.length ? (
        <View>
          <Text variant="label" className="mt-2 text-ink-soft">
            Anteriores
          </Text>
          {anteriores.data.map((j, i, arr) => (
            <ListRow
              key={j.id}
              title={j.titulo}
              subtitle={`${diaMes(fechaClave(j.inicio))} · ${j.lugar} · ${plural(j.inscritos, '1 asistente', `${j.inscritos} asistentes`)}`}
              onPress={() => router.push({ pathname: '/jornada/[id]', params: { id: j.id } })}
              trailing={<CaretRightIcon size={18} color={color.inkSoft} />}
              last={i === arr.length - 1}
            />
          ))}
        </View>
      ) : null}
    </>
  );
}

/** Entrada al mapa solidario: cuántas jornadas están ubicadas en Pereira. */
function MapaEntrada() {
  const todas = useJornadas();
  const ubicadas = (todas.data ?? []).filter((j) => typeof j.latitud === 'number' && typeof j.longitud === 'number').length;
  const detalle = ubicadas ? `${plural(ubicadas, '1 jornada', `${ubicadas} jornadas`)} y sismos recientes` : 'Jornadas y sismos recientes';

  return (
    <Tile tone="neutral" contentClassName="flex-row items-center gap-3" onPress={() => router.push('/mapa')} accessibilityLabel={`Mapa de jornadas. ${detalle}`}>
      <View className="h-11 w-11 items-center justify-center rounded-full bg-menta">
        <MapTrifoldIcon size={22} color={tile.confirmar.fg} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="bodyMedium">Mapa de jornadas</Text>
        <Text variant="caption" className="text-ink-soft">
          {detalle}
        </Text>
      </View>
      <CaretRightIcon size={20} color={color.ink} />
    </Tile>
  );
}

/* ---------- Seguimientos (HU-22) ---------- */

function Seguimientos({ hoy }: { hoy: string }) {
  const pendientes = useSeguimientos({ estado: 'pendiente' });
  const lista = pendientes.data ?? [];
  const urgentes = masUrgentes(lista, 3);

  return (
    <>
      <Seccion
        titulo="Seguimientos"
        detalle={lista.length ? `${plural(lista.length, '1 pendiente', `${lista.length} pendientes`)} · desliza para resolver` : undefined}
        accion={<Accion label="Ver todos" variante="texto" onPress={() => router.push('/seguimientos')} accessibilityLabel="Ver todos los seguimientos" />}
      />
      {pendientes.data && urgentes.length === 0 ? (
        <EmptyState title="Nadie por llamar" body="Cuando marques a un asistente con «Requiere seguimiento», aparecerá aquí." />
      ) : (
        <View>
          {urgentes.map((s, i) => (
            <SeguimientoItem key={s.id} seguimiento={s} hoy={hoy} last={i === urgentes.length - 1} />
          ))}
        </View>
      )}
    </>
  );
}

/* ---------- Personas afectadas (HU-17) ---------- */

const etiquetasAfectacion = (p: Paciente) =>
  p.afectaciones.length
    ? p.afectaciones.map((a) => AFECTACIONES.find((x) => x.valor === a)?.etiqueta ?? a).join(', ')
    : 'Tipo de afectación sin registrar';

const etiquetaTarifa = (p: Paciente) => (p.tarifa === 'gratuita' ? 'Gratuita' : p.tarifa === 'social' ? 'Tarifa social' : 'Tarifa normal');

function Afectados() {
  const afectados = usePacientes({ soloAfectados: true });
  const lista = afectados.data ?? [];
  const visibles = lista.slice(0, MAX_AFECTADOS);

  return (
    <>
      <Seccion
        titulo="Personas afectadas"
        detalle={afectados.data ? plural(lista.length, '1 persona en tu consulta', `${lista.length} personas en tu consulta`) : undefined}
        accion={
          lista.length > MAX_AFECTADOS ? (
            <Accion label="Ver todas" variante="texto" onPress={() => router.push('/pacientes')} accessibilityLabel="Ver todos los pacientes" />
          ) : undefined
        }
      />
      {afectados.data && lista.length === 0 ? (
        <EmptyState
          title="Sin personas afectadas registradas"
          body="Marca en la ficha del paciente si fue afectado por el sismo y el tipo de afectación."
        />
      ) : (
        <View>
          {visibles.map((p, i) => (
            <ListRow
              key={p.id}
              title={p.nombre}
              subtitle={`${etiquetasAfectacion(p)} · ${etiquetaTarifa(p)}`}
              badge={p.tarifa !== 'normal' ? <SolidarioMark /> : null}
              trailing={<CaretRightIcon size={18} color={color.inkSoft} />}
              onPress={() => router.push({ pathname: '/paciente/[id]', params: { id: p.id } })}
              last={i === visibles.length - 1}
            />
          ))}
        </View>
      )}
    </>
  );
}

/* ---------- Líneas de ayuda (HU-19) ---------- */

function LineasDeAyuda() {
  const recursos = useRecursos();
  const lista = recursos.data ?? [];

  return (
    <>
      <Seccion
        titulo="Líneas de ayuda"
        accion={
          lista.length > 1 ? (
            <Accion
              label="Todas"
              icon={ShareNetworkIcon}
              variante="texto"
              onPress={() => compartirTexto(textoDirectorio(lista), 'Líneas de ayuda')}
              accessibilityLabel="Compartir todas las líneas de ayuda"
            />
          ) : undefined
        }
      />
      {recursos.data && lista.length === 0 ? (
        <EmptyState title="Sin líneas cargadas" body="Las líneas de ayuda llegan con los datos del consultorio." />
      ) : (
        lista.map((r) => <RecursoItem key={r.id} recurso={r} />)
      )}
    </>
  );
}

/* ---------- Informe del mes (HU-23) ---------- */

function InformeEnlace() {
  const mes = mesClave();
  return (
    <Tile
      tone="neutral"
      className="mt-4"
      contentClassName="flex-row items-center gap-3"
      onPress={() => router.push('/informe')}
      accessibilityLabel={`Informe del mes, ${mesTexto(mes)}`}>
      <View className="flex-1 gap-0.5">
        <Text variant="bodyMedium">Informe del mes</Text>
        <Text variant="caption" className="text-ink-soft">
          {capitalizar(mesTexto(mes))}
        </Text>
      </View>
      <CaretRightIcon size={20} color={color.ink} />
    </Tile>
  );
}
