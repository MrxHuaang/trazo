import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import WebViewOriginal, { type WebViewMessageEvent } from 'react-native-webview';

import { htmlMapa } from './leaflet-html';
import type { LatLng } from './ubicacion';

/**
 * Los tipos de react-native-webview 14 declaran `WebView<P = undefined>` y `props & undefined`
 * se vuelve `never`. Se fija P = object para recuperar las props sin tocar el componente.
 */
const WebView = WebViewOriginal as unknown as typeof WebViewOriginal<object>;
type WebViewRef = WebViewOriginal<object>;

export type PuntoJornada = { id: string; lat: number; lng: number; proxima: boolean };
export type PuntoSismo = { id: string; lat: number; lng: number; mag: number };

/** Métodos para mover el mapa sin recargar la WebView. */
export type MapaLeafletHandle = {
  setJornadas: (lista: PuntoJornada[]) => void;
  setSismos: (lista: PuntoSismo[]) => void;
  mostrarSismos: (visible: boolean) => void;
  seleccionar: (id: string | null) => void;
  setUsuario: (punto: LatLng) => void;
  setPunto: (punto: LatLng) => void;
  moverA: (punto: LatLng, zoom?: number) => void;
  encuadrar: (puntos: LatLng[]) => void;
  acercar: () => void;
  alejar: () => void;
};

type MensajeMapa =
  | { tipo: 'listo' }
  | { tipo: 'sin-leaflet' }
  | { tipo: 'mapa' }
  | { tipo: 'jornada'; id: string }
  | { tipo: 'sismo'; id: string }
  | { tipo: 'punto'; lat: number; lng: number };

type MapaLeafletProps = {
  ref?: Ref<MapaLeafletHandle>;
  centro: LatLng;
  zoom?: number;
  /** Modo selección: tocar el mapa fija un punto y avisa con `onPunto`. */
  elegir?: boolean;
  onListo?: () => void;
  /** Leaflet o la página no cargaron (casi siempre, sin internet). */
  onSinMapa?: () => void;
  onJornada?: (id: string) => void;
  onSismo?: (id: string) => void;
  onTocarMapa?: () => void;
  onPunto?: (punto: LatLng) => void;
};

/** Mapa de Leaflet + OpenStreetMap dentro de una WebView. */
export function MapaLeaflet({ ref, centro, zoom = 13, elegir = false, onListo, onSinMapa, onJornada, onSismo, onTocarMapa, onPunto }: MapaLeafletProps) {
  const web = useRef<WebViewRef>(null);
  const reducir = useReducedMotion();
  // El documento se arma una sola vez: los cambios posteriores llegan por `injectJavaScript`.
  const [html] = useState(() => htmlMapa({ latitud: centro.latitud, longitud: centro.longitud, zoom, elegir, animar: !reducir }));

  const correr = (script: string) => web.current?.injectJavaScript(`${script};true;`);

  useImperativeHandle(ref, () => ({
    setJornadas: (lista) => correr(`window.setJornadas(${JSON.stringify(lista)})`),
    setSismos: (lista) => correr(`window.setSismos(${JSON.stringify(lista)})`),
    mostrarSismos: (visible) => correr(`window.mostrarSismos(${visible ? 'true' : 'false'})`),
    seleccionar: (id) => correr(`window.seleccionar(${JSON.stringify(id)})`),
    setUsuario: ({ latitud, longitud }) => correr(`window.setUsuario(${latitud},${longitud})`),
    setPunto: ({ latitud, longitud }) => correr(`window.setPunto(${latitud},${longitud})`),
    moverA: ({ latitud, longitud }, z) => correr(`window.moverA(${latitud},${longitud},${z ?? 'undefined'})`),
    encuadrar: (puntos) => correr(`window.encuadrar(${JSON.stringify(puntos.map((p) => [p.latitud, p.longitud]))})`),
    acercar: () => correr('window.acercar()'),
    alejar: () => correr('window.alejar()'),
  }));

  const alRecibir = (e: WebViewMessageEvent) => {
    let m: MensajeMapa;
    try {
      m = JSON.parse(e.nativeEvent.data) as MensajeMapa;
    } catch {
      return;
    }
    if (m.tipo === 'listo') onListo?.();
    else if (m.tipo === 'sin-leaflet') onSinMapa?.();
    else if (m.tipo === 'jornada') onJornada?.(m.id);
    else if (m.tipo === 'sismo') onSismo?.(m.id);
    else if (m.tipo === 'mapa') onTocarMapa?.();
    else if (m.tipo === 'punto') onPunto?.({ latitud: m.lat, longitud: m.lng });
  };

  return (
    <View className="flex-1 bg-canvas">
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://localhost/' }}
        javaScriptEnabled
        domStorageEnabled={false}
        overScrollMode="never"
        bounces={false}
        setSupportMultipleWindows={false}
        onMessage={alRecibir}
        onError={() => onSinMapa?.()}
        accessibilityLabel="Mapa de Pereira con las jornadas"
      />
    </View>
  );
}
