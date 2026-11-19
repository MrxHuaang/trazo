import {Video} from '@remotion/media';
import {Sequence, staticFile} from 'remotion';
import {FUENTE} from '../fuentes';
import {COLOR} from '../tema';

/** Pantalla de 405 x 900 (grabaciones 1080 x 2400) dentro de un marco fino tipo Pixel. */
export const PANTALLA = {ancho: 405, alto: 900} as const;
const BISEL = 9;
export const TELEFONO = {ancho: PANTALLA.ancho + BISEL * 2, alto: PANTALLA.alto + BISEL * 2} as const;

type Props = {
  readonly archivo: string;
  /** false si la grabacion todavia no existe: se muestra un marcador. */
  readonly existe: boolean;
  /** Fotograma (local) en que empieza la grabacion. */
  readonly inicio: number;
  readonly duracion: number;
  readonly style?: React.CSSProperties;
};

export const Telefono: React.FC<Props> = ({archivo, existe, inicio, duracion, style}) => {
  return (
    <div
      style={{
        position: 'absolute',
        width: TELEFONO.ancho,
        height: TELEFONO.alto,
        borderRadius: 58,
        backgroundColor: COLOR.tinta,
        padding: BISEL,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Botones laterales: dos trazos finos, como en el Pixel */}
      <div style={{position: 'absolute', right: -4, top: 210, width: 4, height: 64, borderRadius: 2, backgroundColor: COLOR.tinta}} />
      <div style={{position: 'absolute', right: -4, top: 300, width: 4, height: 110, borderRadius: 2, backgroundColor: COLOR.tinta}} />
      <div
        style={{
          position: 'relative',
          width: PANTALLA.ancho,
          height: PANTALLA.alto,
          borderRadius: 49,
          overflow: 'hidden',
          backgroundColor: COLOR.linea,
        }}
      >
        {existe ? (
          <Sequence from={inicio} durationInFrames={duracion} layout="none" name="Grabacion">
            <Video
              name={archivo}
              src={staticFile(`clips/${archivo}`)}
              muted
              objectFit="cover"
              style={{width: PANTALLA.ancho, height: PANTALLA.alto}}
            />
          </Sequence>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontFamily: FUENTE.mono,
              color: COLOR.gris,
            }}
          >
            <div style={{fontSize: 22}}>{archivo}</div>
            <div style={{fontSize: 18}}>falta la grabación</div>
          </div>
        )}
      </div>
    </div>
  );
};
