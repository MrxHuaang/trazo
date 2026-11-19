import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ALTO_LINEA_DISPLAY, lineasApoyo, tamanoTitulo, useFuentesListas} from '../medidas';
import type {Seccion} from '../secciones';
import {COLOR, DISPOSICION, LIENZO, TIEMPO, TONOS} from '../tema';
import {ALTO_ETIQUETA, Etiqueta} from './Etiqueta';
import {TELEFONO, Telefono} from './Telefono';
import {ESPACIO_APOYO, TAMANO_APOYO, TituloSeccion} from './TituloSeccion';

type Props = {
  readonly seccion: Seccion;
  /** Posicion de la seccion (0, 1, ...): alterna el lado del telefono. */
  readonly orden: number;
  readonly total: number;
  /** Duracion real de la grabacion, o null si todavia no existe. */
  readonly segundosClip: number | null;
};

const CAMBIO = Easing.bezier(0.65, 0, 0.35, 1);

// Si la seccion no fija momentos. Ninguna entra antes de que el telefono termine de llegar.
const momentosPorDefecto = (n: number, segundos: number) => {
  const fracciones = n >= 3 ? [0.1, 0.38, 0.66] : [0.14, 0.5];
  return fracciones.slice(0, n).map((f) => Math.max(TIEMPO.cambio + 0.6, f * segundos));
};

/**
 * Primero la tarjeta con el titulo grande y luego la grabacion. No hay corte entre las dos:
 * el panel de color entra por un lado, empuja el texto a su columna y trae el telefono.
 */
export const SeccionEscena: React.FC<Props> = ({seccion, orden, total, segundosClip}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const listas = useFuentesListas();
  if (!listas) return null;

  const tarjeta = Math.round(TIEMPO.tarjeta * fps);
  const segundos = segundosClip ?? TIEMPO.marcador;
  const duracionClip = Math.ceil(segundos * fps);
  const telefonoDerecha = orden % 2 === 0;
  const tono = TONOS[seccion.tono];

  const p = interpolate(frame, [tarjeta, tarjeta + TIEMPO.cambio * fps], [0, 1], {
    easing: CAMBIO,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // El titulo se mide para los dos anchos y se interpola con p. En la tarjeta se apoya en pisoTexto, por eso el tope sale desde abajo.
  const {anchoPanel, anchoTexto, topeGrabacion, pisoTexto} = DISPOSICION;
  const anchoTarjeta = LIENZO.ancho - LIENZO.margen * 2;
  const tamanoTarjeta = tamanoTitulo(seccion.titulo, anchoTarjeta, 240);
  const tamanoGrabacion = tamanoTitulo(seccion.titulo, anchoTexto, 168);
  const lineasTitulo = seccion.titulo.split('\n').length;
  const altoApoyo = lineasApoyo(seccion.apoyo, anchoTexto, TAMANO_APOYO) * TAMANO_APOYO * 1.25;
  const topeTarjeta = pisoTexto - (lineasTitulo * tamanoTarjeta * ALTO_LINEA_DISPLAY + ESPACIO_APOYO + altoApoyo);

  const izquierda = telefonoDerecha ? LIENZO.margen : LIENZO.margen + anchoPanel * p;
  const anchoCabecera = anchoTarjeta + (anchoTexto - anchoTarjeta) * p;
  const panelX = telefonoDerecha ? LIENZO.ancho - anchoPanel * p : -anchoPanel + anchoPanel * p;

  const momentos = seccion.momentos ?? momentosPorDefecto(seccion.etiquetas.length, segundos);
  const aparece = momentos.map((s) => tarjeta + Math.round(s * fps));

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.lienzo}}>
      {/* Panel del color del modulo; el telefono va adentro para moverse con el */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: panelX,
          width: anchoPanel,
          height: LIENZO.alto,
          backgroundColor: tono.fondo,
          overflow: 'hidden',
        }}
      >
        {seccion.tono === 'durazno' ? <Trama color={tono.tinta} /> : null}
        <Telefono
          archivo={seccion.archivo}
          existe={segundosClip !== null}
          inicio={tarjeta}
          duracion={duracionClip}
          style={{
            left: (anchoPanel - TELEFONO.ancho) / 2,
            top: (LIENZO.alto - TELEFONO.alto) / 2,
            translate: `0 ${(1 - p) * 90}px`,
          }}
        />
      </div>

      <TituloSeccion
        numero={seccion.numero}
        total={total}
        modulo={seccion.modulo}
        tono={seccion.tono}
        titulo={seccion.titulo}
        apoyo={seccion.apoyo}
        izquierda={izquierda}
        ancho={anchoCabecera}
        tope={topeTarjeta + (topeGrabacion - topeTarjeta) * p}
        tamano={tamanoTarjeta + (tamanoGrabacion - tamanoTarjeta) * p}
      />

      {/* Etiquetas, sincronizadas con lo que pasa en la grabacion */}
      <div
        style={{
          position: 'absolute',
          left: izquierda,
          top: pisoTexto - seccion.etiquetas.length * ALTO_ETIQUETA,
          width: anchoTexto,
        }}
      >
        {seccion.etiquetas.map((texto, i) => (
          <Etiqueta
            key={texto}
            texto={texto}
            indice={i}
            aparece={aparece[i]}
            siguiente={aparece[i + 1] ?? null}
            ancho={anchoTexto}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Igual que en la app: Solidario siempre lleva el rayado sobre el durazno.
const Trama: React.FC<{readonly color: string}> = ({color}) => (
  <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
    <defs>
      <pattern id="trama-solidario" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="18" stroke={color} strokeWidth="2" strokeOpacity="0.1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#trama-solidario)" />
  </svg>
);
