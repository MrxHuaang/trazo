import type {CSSProperties} from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {FUENTE} from '../fuentes';

type Props = {
  /** Texto a revelar. "\n" parte la linea; *palabra* sale en serif italica. */
  readonly texto: string;
  /** Fotograma (local) en que empieza la primera palabra. */
  readonly desde?: number;
  /** Fotogramas entre una palabra y la siguiente. */
  readonly paso?: number;
  /** Fotogramas que tarda cada palabra en subir. */
  readonly duracion?: number;
  readonly style?: CSSProperties;
};

const SALIDA = Easing.bezier(0.16, 1, 0.3, 1);

/** Cada palabra sube desde detras de su propio recorte, sin fundido de opacidad. */
export const Revelar: React.FC<Props> = ({texto, desde = 0, paso = 3, duracion = 24, style}) => {
  const frame = useCurrentFrame();
  let indice = 0;

  return (
    <div style={style}>
      {texto.split('\n').map((linea, l) => (
        <div key={l} style={{display: 'block'}}>
          {linea.split(' ').map((palabra, p, todas) => {
            const i = indice++;
            // En "*sismo*." el punto queda fuera de la italica.
            const italica = palabra.startsWith('*') && palabra.replace(/[.,]$/, '').endsWith('*');
            const signo = italica ? palabra.match(/[.,]$/)?.[0] ?? '' : '';
            const limpia = italica ? palabra.replace(/[.,]$/, '').slice(1, -1) : palabra;
            const avance = interpolate(frame, [desde + i * paso, desde + i * paso + duracion], [0, 1], {
              easing: SALIDA,
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <span key={p}>
                <span
                  style={{
                    display: 'inline-block',
                    overflow: 'hidden',
                    verticalAlign: 'top',
                    paddingBottom: '0.16em',
                    marginBottom: '-0.16em',
                    // Sin esta holgura el recorte se come el borde de las italicas y del tracking negativo
                    paddingRight: '0.12em',
                    marginRight: '-0.12em',
                    paddingLeft: '0.04em',
                    marginLeft: '-0.04em',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      translate: `0 ${(1 - avance) * 112}%`,
                    }}
                  >
                    {italica ? (
                      <span
                        style={{
                          fontFamily: FUENTE.serif,
                          fontStyle: 'italic',
                          fontWeight: 400,
                          fontSize: '1.12em',
                          letterSpacing: '-0.01em',
                          lineHeight: 1,
                        }}
                      >
                        {limpia}
                      </span>
                    ) : (
                      limpia
                    )}
                    {signo}
                  </span>
                </span>
                {p < todas.length - 1 ? ' ' : null}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
