import { CrosshairIcon } from 'phosphor-react-native/src/icons/Crosshair';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import type { ReactNode, RefObject } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { color } from '@/theme';
import { Button, Text, TraceLine } from '@/ui';

import { BotonIcono } from '../components/accion';
import type { MapaLeafletHandle } from './mapa-leaflet';
import { abrirAjustesDelSistema, type EstadoPermiso } from './ubicacion';

type ControlesProps = {
  mapa: RefObject<MapaLeafletHandle | null>;
  top: number;
  buscando: boolean;
  onMiUbicacion: () => void;
  /** Controles propios de la pantalla (encuadrar, capas…). */
  children?: ReactNode;
};

/** Controles del mapa: reemplazan los de Leaflet para verse y sentirse como el resto de la app. */
export function ControlesMapa({ mapa, top, buscando, onMiUbicacion, children }: ControlesProps) {
  return (
    <View className="absolute right-4 gap-2" style={{ top }}>
      <BotonIcono icon={PlusIcon} label="Acercar el mapa" fondo="surface" onPress={() => mapa.current?.acercar()} />
      <BotonIcono icon={MinusIcon} label="Alejar el mapa" fondo="surface" onPress={() => mapa.current?.alejar()} />
      {buscando ? (
        <View className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface" accessibilityLabel="Buscando tu ubicación">
          <ActivityIndicator color={color.accent} />
        </View>
      ) : (
        <BotonIcono icon={CrosshairIcon} label="Ir a mi ubicación" fondo="surface" tone={color.accent} onPress={onMiUbicacion} />
      )}
      {children}
    </View>
  );
}

/** Título flotante del mapa. */
export function TituloMapa({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <View className="mx-3 flex-1 items-center rounded-tile border border-line bg-surface px-4 py-2">
      <Text variant="bodyMedium" numberOfLines={1} accessibilityRole="header">
        {titulo}
      </Text>
      {detalle ? (
        <Text variant="caption" className="text-ink-soft" numberOfLines={1}>
          {detalle}
        </Text>
      ) : null}
    </View>
  );
}

const TEXTO_PERMISO: Record<Exclude<EstadoPermiso, 'concedido' | 'comprobando'>, { titulo: string; cuerpo: string; boton: string }> = {
  sin_preguntar: {
    titulo: 'Mira dónde estás respecto a las jornadas',
    cuerpo: 'Tu ubicación solo se usa en este mapa mientras lo tienes abierto. No se guarda ni se comparte.',
    boton: 'Permitir ubicación',
  },
  denegado: {
    titulo: 'El mapa funciona sin tu ubicación',
    cuerpo: 'Puedes ver las jornadas y cómo llegar. Si quieres verte en el mapa, permite la ubicación.',
    boton: 'Permitir ubicación',
  },
  bloqueado: {
    titulo: 'El mapa funciona sin tu ubicación',
    cuerpo: 'El permiso está desactivado para Trazo. Si quieres verte en el mapa, actívalo en los ajustes del teléfono.',
    boton: 'Abrir ajustes',
  },
};

type AvisoPermisoProps = {
  permiso: EstadoPermiso;
  onPermitir: () => void;
  onCerrar: () => void;
};

/** Explica el permiso de ubicación antes de pedirlo y qué hacer si se negó. */
export function AvisoPermiso({ permiso, onPermitir, onCerrar }: AvisoPermisoProps) {
  if (permiso === 'concedido' || permiso === 'comprobando') return null;
  const texto = TEXTO_PERMISO[permiso];
  return (
    <View className="gap-3 rounded-tile border border-line bg-surface p-4">
      <View className="gap-1">
        <Text variant="heading">{texto.titulo}</Text>
        <Text variant="body" className="text-ink-soft">
          {texto.cuerpo}
        </Text>
      </View>
      <View className="flex-row justify-end gap-2">
        <Button label="Ahora no" variant="ghost" size="sm" onPress={onCerrar} />
        <Button
          label={texto.boton}
          variant="accent"
          size="sm"
          onPress={permiso === 'bloqueado' ? () => void abrirAjustesDelSistema() : onPermitir}
        />
      </View>
    </View>
  );
}

type SinMapaProps = {
  top: number;
  onReintentar: () => void;
};

/** El mapa no cargó (sin internet): el Trazo en calma, qué pasa y cómo seguir. */
export function SinMapa({ top, onReintentar }: SinMapaProps) {
  return (
    <View className="absolute inset-0 justify-center gap-3 bg-canvas px-6" style={{ paddingTop: top }}>
      <TraceLine height={40} agitation={0.5} />
      <Text variant="title">El mapa necesita internet</Text>
      <Text variant="body" className="text-ink-soft">
        No pudimos cargar las calles. Tus jornadas siguen en la pestaña Solidario; el mapa vuelve cuando haya conexión.
      </Text>
      <Button label="Intentar de nuevo" variant="secondary" onPress={onReintentar} className="mt-2 self-start" />
    </View>
  );
}

/** Marca de leyenda: el mismo dibujo que el punto del mapa. */
export function Leyenda({ tipo, texto }: { tipo: 'proxima' | 'pasada' | 'sismo'; texto: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {tipo === 'proxima' ? (
        <View className="h-3 w-3 rounded-full bg-menta-ink" />
      ) : tipo === 'pasada' ? (
        <View className="h-3 w-3 rounded-full border-2 border-ink-soft bg-surface" />
      ) : (
        <View className="h-3 w-3 rounded-full border border-dashed border-ink-soft bg-quiet" />
      )}
      <Text variant="caption" className="text-ink-soft">
        {texto}
      </Text>
    </View>
  );
}
