/**
 * Documento HTML del mapa: Leaflet + teselas de OpenStreetMap dentro de una WebView
 * (el mismo enfoque de la clase de mapas). No usa los controles por defecto de Leaflet:
 * los botones son de la app y hablan con el mapa por `injectJavaScript`.
 *
 * Mensajes hacia la app (JSON): listo · sin-leaflet · jornada {id} · sismo {id} · mapa · punto {lat, lng}.
 */
import { color, tile } from '@/theme';

export type OpcionesMapa = {
  latitud: number;
  longitud: number;
  zoom: number;
  /** En modo selección, tocar el mapa fija un punto. */
  elegir: boolean;
  animar: boolean;
};

/** Colores de la paleta que el mapa necesita dentro de la WebView. */
const C = {
  lienzo: color.canvas,
  superficie: color.surface,
  tinta: color.ink,
  tintaSuave: color.inkSoft,
  acento: color.accent,
  acentoSuave: color.accentSoft,
  jornada: tile.confirmar.fg,
};

export function htmlMapa({ latitud, longitud, zoom, elegir, animar }: OpcionesMapa) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: ${C.lienzo}; }
  /* Mapa sobrio: se baja la saturación de las teselas para que resalten los puntos de la app. */
  .leaflet-tile-pane { filter: saturate(0.28) contrast(0.94) brightness(1.04); }
  .leaflet-control-attribution { font: 10px sans-serif; color: ${C.tintaSuave}; background: ${C.superficie}CC; border-radius: 6px 0 0 0; }
  .leaflet-control-attribution a { color: ${C.tintaSuave}; }
  .j { border-radius: 50%; box-sizing: border-box; }
  /* Próxima: punto lleno y grande. Pasada: anillo pequeño. Se distinguen por forma, no solo por color. */
  .prox { width: 26px; height: 26px; background: ${C.jornada}; border: 3px solid ${C.superficie}; box-shadow: 0 0 0 1.5px ${C.jornada}; }
  .pas { width: 18px; height: 18px; background: ${C.superficie}; border: 3px solid ${C.tintaSuave}; }
  .act { box-shadow: 0 0 0 4px ${C.acento}; }
  .yo { width: 18px; height: 18px; border-radius: 50%; box-sizing: border-box; background: ${C.acento}; border: 3px solid ${C.superficie}; box-shadow: 0 0 0 6px ${C.acento}33; }
  .pin { width: 26px; height: 26px; box-sizing: border-box; background: ${C.acento}; border: 3px solid ${C.superficie}; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 0 0 1.5px ${C.acento}; }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function () {
  function enviar(m) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  if (typeof L === 'undefined') { enviar({ tipo: 'sin-leaflet' }); return; }

  var ELEGIR = ${elegir ? 'true' : 'false'};
  var ANIMAR = ${animar ? 'true' : 'false'};
  var map = L.map('map', { zoomControl: false, attributionControl: true, zoomSnap: 0.5, fadeAnimation: ANIMAR, zoomAnimation: ANIMAR, markerZoomAnimation: ANIMAR })
    .setView([${latitud}, ${longitud}], ${zoom});
  map.attributionControl.setPrefix(false);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);

  var capaSismos = L.layerGroup().addTo(map);
  var capaJornadas = L.layerGroup().addTo(map);
  var marcadores = {};
  var seleccion = null;
  var usuario = null;
  var punto = null;

  function icono(j, activa) {
    var lado = j.proxima ? 26 : 18;
    var clases = 'j ' + (j.proxima ? 'prox' : 'pas') + (activa ? ' act' : '');
    return L.divIcon({ className: '', html: '<div class="' + clases + '"></div>', iconSize: [lado, lado], iconAnchor: [lado / 2, lado / 2] });
  }

  window.setJornadas = function (lista) {
    capaJornadas.clearLayers();
    marcadores = {};
    lista.forEach(function (j) {
      var m = L.marker([j.lat, j.lng], { icon: icono(j, j.id === seleccion), keyboard: false, zIndexOffset: j.proxima ? 200 : 0 }).addTo(capaJornadas);
      m.on('click', function () { enviar({ tipo: 'jornada', id: j.id }); });
      marcadores[j.id] = { m: m, j: j };
    });
  };

  window.seleccionar = function (id) {
    seleccion = id;
    Object.keys(marcadores).forEach(function (k) {
      var x = marcadores[k];
      x.m.setIcon(icono(x.j, k === id));
      x.m.setZIndexOffset(k === id ? 1000 : x.j.proxima ? 200 : 0);
    });
  };

  window.setSismos = function (lista) {
    capaSismos.clearLayers();
    lista.forEach(function (s) {
      var c = L.circleMarker([s.lat, s.lng], {
        radius: 7 + Math.max(s.mag - 2.5, 0) * 5, color: '${C.tintaSuave}', weight: 1.5, dashArray: '4 3',
        fillColor: '${C.tinta}', fillOpacity: 0.12, bubblingMouseEvents: false
      }).addTo(capaSismos);
      c.on('click', function () { enviar({ tipo: 'sismo', id: s.id }); });
    });
  };

  window.mostrarSismos = function (visible) {
    if (visible) map.addLayer(capaSismos); else map.removeLayer(capaSismos);
  };

  window.setUsuario = function (lat, lng) {
    if (!usuario) {
      usuario = L.marker([lat, lng], {
        icon: L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        interactive: false, keyboard: false, zIndexOffset: 500
      }).addTo(map);
    } else usuario.setLatLng([lat, lng]);
  };

  window.setPunto = function (lat, lng) {
    if (!punto) {
      punto = L.marker([lat, lng], {
        icon: L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [26, 26], iconAnchor: [13, 30] }),
        interactive: false, keyboard: false, zIndexOffset: 900
      }).addTo(map);
    } else punto.setLatLng([lat, lng]);
  };

  window.moverA = function (lat, lng, zoom) { map.setView([lat, lng], zoom || map.getZoom(), { animate: ANIMAR }); };
  window.encuadrar = function (puntos) {
    if (!puntos.length) return;
    if (puntos.length === 1) { map.setView(puntos[0], 15, { animate: ANIMAR }); return; }
    map.fitBounds(puntos, { padding: [56, 56], maxZoom: 15, animate: ANIMAR });
  };
  window.acercar = function () { map.zoomIn(1); };
  window.alejar = function () { map.zoomOut(1); };

  map.on('click', function (e) {
    if (ELEGIR) {
      window.setPunto(e.latlng.lat, e.latlng.lng);
      enviar({ tipo: 'punto', lat: e.latlng.lat, lng: e.latlng.lng });
    } else enviar({ tipo: 'mapa' });
  });

  enviar({ tipo: 'listo' });
})();
</script>
</body>
</html>`;
}
