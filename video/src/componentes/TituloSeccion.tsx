import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {FUENTE} from '../fuentes';
import {ALTO_LINEA_DISPLAY, TRACKING_DISPLAY} from '../medidas';
import {COLOR, DISPOSICION, TONOS, type Tono} from '../tema';
import {Revelar} from './Revelar';

type Props = {
  readonly numero: string;
  readonly total: number;
  readonly modulo: string;
  readonly tono: Tono;
  readonly titulo: string;
  readonly apoyo: string;
  /** Borde izquierdo de la columna de texto. */
  readonly izquierda: number;
  /** Ancho de la cabecera (regla e indice). */
  readonly ancho: number;
  /** Tope del bloque titulo + apoyo. */
  readonly tope: number;
  /** Tamano del titulo en px. */
  readonly tamano: number;
};

const SALIDA = Easing.bezier(0.16, 1, 0.3, 1);
export const TAMANO_APOYO = 44;
export const ESPACIO_APOYO = 30;

/** No anima posicion ni tamano: eso lo interpola Seccion y llega aqui por props. */
export const TituloSeccion: React.FC<Props> = ({numero, total, modulo, tono, titulo, apoyo, izquierda, ancho, tope, tamano}) => {
  const frame = useCurrentFrame();
  const regla = interpolate(frame, [2, 30], [0, 1], {easing: SALIDA, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <>
      {/* Cabecera: indice, modulo y regla fina */}
      <div style={{position: 'absolute', left: izquierda, top: 84, width: ancho}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32}}>
          <Revelar
            texto={`${numero} / ${String(total).padStart(2, '0')}`}
            desde={4}
            style={{fontFamily: FUENTE.mono, fontSize: 22, color: COLOR.tinta, letterSpacing: '0.04em'}}
          />
          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
            <div
              style={{
                width: 14,
                height: 14,
                backgroundColor: TONOS[tono].fondo,
                outline: `1px solid ${TONOS[tono].tinta}`,
                scale: interpolate(frame, [8, 26], [0, 1], {easing: SALIDA, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              }}
            />
            <Revelar
              texto={`Módulo ${modulo}`}
              desde={8}
              style={{fontFamily: FUENTE.mono, fontSize: 20, color: COLOR.gris, letterSpacing: '0.08em', textTransform: 'uppercase'}}
            />
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            height: 2,
            width: ancho,
            backgroundColor: COLOR.linea,
            scale: `${regla} 1`,
            transformOrigin: 'left center',
          }}
        />
      </div>

      {/* Titulo y apoyo */}
      <div style={{position: 'absolute', left: izquierda, top: tope, width: DISPOSICION.anchoTexto}}>
        <Revelar
          texto={titulo}
          desde={10}
          paso={4}
          duracion={30}
          style={{
            fontFamily: FUENTE.display,
            fontWeight: 800,
            fontSize: tamano,
            lineHeight: ALTO_LINEA_DISPLAY,
            letterSpacing: TRACKING_DISPLAY,
            color: COLOR.tinta,
            whiteSpace: 'pre',
            marginLeft: '-0.04em',
          }}
        />
        <Revelar
          texto={apoyo}
          desde={22}
          paso={2}
          duracion={24}
          style={{
            marginTop: ESPACIO_APOYO,
            fontFamily: FUENTE.texto,
            fontWeight: 400,
            fontSize: TAMANO_APOYO,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            color: COLOR.gris,
            width: DISPOSICION.anchoTexto,
          }}
        />
      </div>
    </>
  );
};
