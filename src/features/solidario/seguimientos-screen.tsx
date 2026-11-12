import { useState } from 'react';

import { useConsultorio, useSeguimientos } from '@/data/hooks';
import { hoyClave } from '@/lib/dates';
import { Aparecer, EmptyState, Text } from '@/ui';

import { Accion } from './components/accion';
import { PantallaDetalle } from './components/pantalla-detalle';
import { Seccion } from './components/seccion';
import { SeguimientoItem } from './components/seguimiento-item';
import { agruparSeguimientos, GRUPOS, plural, type ClaveGrupo } from './rules';

const DETALLE: Record<ClaveGrupo, string | undefined> = {
  vencidos: 'Ya pasó la fecha; retómalos cuando puedas.',
  hoy: undefined,
  proximos: undefined,
  hechos: undefined,
};

/** Seguimientos (HU-22): Vencidos · Hoy · Próximos · Hechos, con Llamar, WhatsApp, Hecho y Posponer 7 días. */
export function SeguimientosScreen() {
  const hoy = hoyClave();
  const seguimientos = useSeguimientos();
  const consultorio = useConsultorio();
  const [verHechos, setVerHechos] = useState(false);

  const grupos = agruparSeguimientos(seguimientos.data ?? [], hoy);
  const pendientes = grupos.vencidos.length + grupos.hoy.length + grupos.proximos.length;
  const hechos = grupos.hechos.length;

  return (
    <PantallaDetalle>
      <Aparecer orden={0} className="gap-1">
        <Text variant="display" accessibilityRole="header">
          Seguimientos
        </Text>
        <Text variant="body" className="text-ink-soft">
          {seguimientos.data
            ? pendientes
              ? `${plural(pendientes, '1 persona', `${pendientes} personas`)} por volver a contactar.`
              : 'Nadie pendiente por ahora.'
            : ' '}
        </Text>
      </Aparecer>

      {seguimientos.data && pendientes === 0 ? (
        <EmptyState
          title="Todo al día"
          body="Los asistentes con «Requiere seguimiento» aparecen aquí."
        />
      ) : null}

      {GRUPOS.filter((g) => g.clave !== 'hechos' && grupos[g.clave].length > 0).map((g, i) => (
        <Aparecer key={g.clave} orden={i + 1} reacomodar>
          <Seccion titulo={g.titulo} detalle={DETALLE[g.clave] ?? plural(grupos[g.clave].length, '1 persona', `${grupos[g.clave].length} personas`)} />
          {grupos[g.clave].map((s, i, arr) => (
            <SeguimientoItem
              key={s.id}
              seguimiento={s}
              hoy={hoy}
              conWhatsApp
              conNota
              profesional={consultorio.data?.profesional}
              last={i === arr.length - 1}
            />
          ))}
        </Aparecer>
      ))}

      {hechos > 0 ? (
        <Aparecer orden={4} reacomodar>
          <Seccion
            titulo="Hechos"
            detalle={plural(hechos, '1 seguimiento completado', `${hechos} seguimientos completados`)}
            accion={
              <Accion
                label={verHechos ? 'Ocultar' : 'Mostrar'}
                variante="texto"
                onPress={() => setVerHechos((v) => !v)}
                accessibilityLabel={verHechos ? 'Ocultar seguimientos hechos' : 'Mostrar seguimientos hechos'}
              />
            }
          />
          {verHechos
            ? grupos.hechos.map((s, i, arr) => <SeguimientoItem key={s.id} seguimiento={s} hoy={hoy} last={i === arr.length - 1} />)
            : null}
        </Aparecer>
      ) : null}
    </PantallaDetalle>
  );
}
