import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatoCOP } from '@/lib/format';
import { tile } from '@/theme';
import { HatchOverlay, NumeroAnimado, Text, TraceLine } from '@/ui';

import { fraseSemana, horasDonadas, plural, porcentajeInasistencias, type ResumenSemana } from './rules';

export type ClaveHistoria = 'atendidas' | 'inasistencias' | 'cobros' | 'donado' | 'afectadas' | 'cierre';

/** Orden de las historias del resumen: una por dato y el cierre con el Trazo. */
export const HISTORIAS: ClaveHistoria[] = ['atendidas', 'inasistencias', 'cobros', 'donado', 'afectadas', 'cierre'];

const FONDO: Record<ClaveHistoria, string> = {
  atendidas: 'bg-lavanda',
  inasistencias: 'bg-menta',
  cobros: 'bg-mantequilla',
  donado: 'bg-durazno',
  afectadas: 'bg-durazno',
  cierre: 'border border-line bg-surface',
};

const TINTA: Record<ClaveHistoria, string> = {
  atendidas: 'text-lavanda-ink',
  inasistencias: 'text-menta-ink',
  cobros: 'text-mantequilla-ink',
  donado: 'text-durazno-ink',
  afectadas: 'text-durazno-ink',
  cierre: 'text-ink',
};

const PUNTOS_MAX = 40;

/** Lo que lee el lector de pantalla de cada historia (las cifras animadas no se anuncian solas). */
export function descripcionHistoria(clave: ClaveHistoria, r: ResumenSemana) {
  switch (clave) {
    case 'atendidas':
      return `${plural(r.atendidas, 'cita atendida', 'citas atendidas')} esta semana`;
    case 'inasistencias':
      return `${plural(r.inasistencias, 'inasistencia', 'inasistencias')}, ${porcentajeInasistencias(r)} % de las citas con resultado`;
    case 'cobros':
      return `Cobrado ${formatoCOP(r.cobrado)}. Por cobrar ${formatoCOP(r.porCobrar)}`;
    case 'donado':
      return `${plural(r.sesionesDonadas, 'sesión donada', 'sesiones donadas')}, ${textoHoras(r.minutosDonados)} de tu tiempo`;
    case 'afectadas':
      return `${plural(r.personasAfectadas, 'persona afectada por el sismo atendida', 'personas afectadas por el sismo atendidas')}`;
    case 'cierre':
      return fraseSemana(r);
  }
}

const textoHoras = (minutos: number) => `${horasDonadas(minutos)} ${horasDonadas(minutos) === '1' ? 'hora' : 'horas'}`;

type HistoriaProps = {
  clave: ClaveHistoria;
  resumen: ResumenSemana;
  /** "lun 9 nov al dom 15 nov". */
  rango: string;
  /** Solo la historia visible cuenta sus cifras; las demás esperan en cero. */
  activa: boolean;
};

/** Una historia del resumen: bloque de color a pantalla completa con su cifra gigante. */
export function Historia({ clave, resumen: r, rango, activa }: HistoriaProps) {
  const tinta = TINTA[clave];
  const solidaria = clave === 'donado' || clave === 'afectadas';

  return (
    <View className={cn('flex-1 justify-between overflow-hidden rounded-tile p-6', FONDO[clave])}>
      {solidaria ? <HatchOverlay color={tile.solidario.fg} opacity={0.1} /> : null}
      <View className="gap-0.5">
        <Text variant="label" className={tinta}>
          {ETIQUETA[clave]}
        </Text>
        <Text variant="caption" className={cn('opacity-70', tinta)}>
          {rango}
        </Text>
      </View>
      <Contenido clave={clave} r={r} activa={activa} tinta={tinta} />
    </View>
  );
}

const ETIQUETA: Record<ClaveHistoria, string> = {
  atendidas: 'Tu semana',
  inasistencias: 'Asistencia',
  cobros: 'Cobrado',
  donado: 'Tiempo donado',
  afectadas: 'Programa solidario',
  cierre: 'Así fue tu semana',
};

function Contenido({ clave, r, activa, tinta }: { clave: ClaveHistoria; r: ResumenSemana; activa: boolean; tinta: string }) {
  switch (clave) {
    case 'atendidas':
      return (
        <Bloque
          cifra={<Cifra valor={r.atendidas} activa={activa} className={tinta} />}
          titulo={r.atendidas === 1 ? 'cita atendida' : 'citas atendidas'}
          tinta={tinta}
          pie={r.atendidas === 0 ? 'Todavía no hay sesiones registradas esta semana.' : 'Cada punto es una sesión que sostuviste.'}>
          <Puntos cantidad={r.atendidas} className={tinta} />
        </Bloque>
      );
    case 'inasistencias':
      return (
        <Bloque
          cifra={<Cifra valor={r.inasistencias} activa={activa} className={tinta} />}
          titulo={r.inasistencias === 1 ? 'inasistencia' : 'inasistencias'}
          tinta={tinta}
          pie={
            r.inasistencias === 0
              ? 'Nadie faltó esta semana.'
              : 'Quien falta dos veces seguidas aparece en Hoy, en Para contactar.'
          }>
          <View className="flex-row items-baseline gap-2">
            <NumeroAnimado
              valor={activa ? porcentajeInasistencias(r) : 0}
              formato={(n) => `${Math.round(n)} %`}
              variant="title"
              className={tinta}
            />
            <Text variant="body" className={tinta}>
              de las citas con resultado
            </Text>
          </View>
        </Bloque>
      );
    case 'cobros':
      return (
        <Bloque
          cifra={<Cifra valor={r.cobrado} activa={activa} formato={formatoCOP} className={tinta} />}
          titulo="cobrado en sesiones de la semana"
          tinta={tinta}
          pie={r.porCobrar > 0 ? 'Lo pendiente está en Pagos, listo para registrar.' : 'Todo lo de esta semana está al día.'}>
          <View className="flex-row items-baseline justify-between gap-3 border-t border-mantequilla-ink/20 pt-3">
            <Text variant="label" className={tinta}>
              Por cobrar
            </Text>
            <NumeroAnimado valor={activa ? r.porCobrar : 0} formato={formatoCOP} variant="mono" className={cn('text-body-lg', tinta)} />
          </View>
        </Bloque>
      );
    case 'donado':
      return (
        <Bloque
          cifra={<Cifra valor={r.sesionesDonadas} activa={activa} className={tinta} />}
          titulo={r.sesionesDonadas === 1 ? 'sesión solidaria' : 'sesiones solidarias'}
          tinta={tinta}
          pie="Atención sin costo dentro del programa solidario.">
          <NumeroAnimado
            valor={activa ? r.minutosDonados : 0}
            formato={(min) => `${textoHoras(min)} de tu tiempo`}
            variant="title"
            className={tinta}
          />
        </Bloque>
      );
    case 'afectadas':
      return (
        <Bloque
          cifra={<Cifra valor={r.personasAfectadas} activa={activa} className={tinta} />}
          titulo={
            r.personasAfectadas === 1
              ? 'persona afectada por el sismo recibió atención'
              : 'personas afectadas por el sismo recibieron atención'
          }
          tinta={tinta}
          pie="Cada persona cuenta una vez, aunque haya venido varias veces."
        />
      );
    case 'cierre':
      return (
        <View className="flex-1 justify-end gap-6">
          <View className="flex-1 justify-center">
            {/* Al llegar al cierre el Trazo se agita y se calma: la semana terminó. */}
            {activa ? (
              <TraceLine key="activa" height={120} calmFrom={0.55} strokeWidth={2.2} />
            ) : (
              <TraceLine height={120} calmFrom={0.55} strokeWidth={2.2} animate={false} />
            )}
          </View>
          <Text variant="title" className={tinta}>
            {fraseSemana(r)}
          </Text>
        </View>
      );
  }
}

function Bloque({ cifra, titulo, tinta, pie, children }: { cifra: ReactNode; titulo: string; tinta: string; pie: string; children?: ReactNode }) {
  return (
    <View className="flex-1 justify-end gap-6">
      <View className="flex-1 justify-center gap-1">
        {cifra}
        <Text variant="heading" className={tinta}>
          {titulo}
        </Text>
      </View>
      {children}
      <Text variant="body" className={tinta}>
        {pie}
      </Text>
    </View>
  );
}

/** Cifra gigante: cuenta desde cero cuando su historia queda a la vista. */
function Cifra({ valor, activa, formato, className }: { valor: number; activa: boolean; formato?: (n: number) => string; className?: string }) {
  return (
    <NumeroAnimado
      valor={activa ? valor : 0}
      formato={formato}
      duracionMs={900}
      variant="number"
      numberOfLines={1}
      adjustsFontSizeToFit
      className={cn('text-[112px] leading-[116px] tracking-[-4px]', className)}
    />
  );
}

/** Un punto por sesión atendida (hasta 40): la semana se ve, no solo se lee. */
function Puntos({ cantidad, className }: { cantidad: number; className?: string }) {
  if (cantidad <= 0) return null;
  const visibles = Math.min(cantidad, PUNTOS_MAX);
  return (
    <View className="flex-row flex-wrap gap-1.5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: visibles }, (_, i) => (
        <View key={i} className="h-3 w-3 rounded-full bg-lavanda-ink" />
      ))}
      {cantidad > PUNTOS_MAX ? (
        <Text variant="caption" className={className}>
          +{cantidad - PUNTOS_MAX}
        </Text>
      ) : null}
    </View>
  );
}
