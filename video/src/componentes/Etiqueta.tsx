import {Easing, interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {FUENTE} from '../fuentes';
import {COLOR} from '../tema';

const SALIDA = Easing.bezier(0.16, 1, 0.3, 1);
export const ALTO_ETIQUETA = 92;

type Props = {
  readonly texto: string;
  readonly indice: number;
  /** Fotograma (local) en que aparece. */
  readonly aparece: number;
  /** Fotograma en que aparece la siguiente; desde ahi esta pasa a segundo plano. */
  readonly siguiente: number | null;
  readonly ancho: number;
};

// Codigos HU/RN y nombres de paquete van en mono dentro de la etiqueta.
const CODIGO = /^(HU|RN)-\d+$/;
const PAQUETE = /^(expo|reanimated)-[a-z-]+$/;
const partes = (texto: string) => texto.split(/(\b(?:HU|RN)-\d+\b|\b(?:expo|reanimated)-[a-z-]+\b)/g).filter(Boolean);

/** Al entrar la siguiente etiqueta, esta pasa a gris para que la vista siga a la nueva. */
export const Etiqueta: React.FC<Props> = ({texto, indice, aparece, siguiente, ancho}) => {
  const frame = useCurrentFrame();
  const regla = interpolate(frame, [aparece, aparece + 18], [0, 1], {
    easing: SALIDA,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sube = interpolate(frame, [aparece + 4, aparece + 26], [0, 1], {
    easing: SALIDA,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const reposo =
    siguiente === null
      ? 0
      : interpolate(frame, [siguiente, siguiente + 14], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const tinta = interpolateColors(reposo, [0, 1], [COLOR.tinta, COLOR.gris]);

  return (
    <div style={{position: 'relative', width: ancho, height: ALTO_ETIQUETA}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: ancho,
          height: 2,
          backgroundColor: interpolateColors(reposo, [0, 1], [COLOR.tinta, '#C9CCD3']),
          scale: `${regla} 1`,
          transformOrigin: 'left center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 24,
          right: 0,
          overflow: 'hidden',
          paddingBottom: 8,
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            translate: `0 ${(1 - sube) * 110}%`,
          }}
        >
          <span style={{fontFamily: FUENTE.mono, fontSize: 20, color: COLOR.gris, width: 72, letterSpacing: '0.02em'}}>
            {String(indice + 1).padStart(2, '0')}
          </span>
          <span style={{fontFamily: FUENTE.texto, fontWeight: 500, fontSize: 40, color: tinta, letterSpacing: '-0.015em'}}>
            {partes(texto).map((parte, i) =>
              CODIGO.test(parte) ? (
                <span key={i} style={{fontFamily: FUENTE.mono, fontWeight: 500, fontSize: 34, color: COLOR.acento, letterSpacing: 0}}>
                  {parte}
                </span>
              ) : PAQUETE.test(parte) ? (
                <span key={i} style={{fontFamily: FUENTE.mono, fontWeight: 500, fontSize: 34, letterSpacing: '-0.02em'}}>
                  {parte}
                </span>
              ) : (
                <span key={i}>{parte}</span>
              ),
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
