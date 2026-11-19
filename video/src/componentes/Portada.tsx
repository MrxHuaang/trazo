import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FUENTE} from '../fuentes';
import {ALTO_LINEA_DISPLAY, TRACKING_DISPLAY, useFuentesListas} from '../medidas';
import {PORTADA} from '../secciones';
import {COLOR, LIENZO} from '../tema';
import {Revelar} from './Revelar';
import {TrazoLinea} from './TrazoLinea';

/** Escena 00. La marca entra cuando la pluma va mas o menos por la mitad. */
export const Portada: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const listas = useFuentesListas();
  if (!listas) return null;

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.lienzo}}>
      {/* Misma cabecera que las secciones, para que la portada no se sienta aparte */}
      <div style={{position: 'absolute', left: LIENZO.margen, top: 84, width: LIENZO.ancho - LIENZO.margen * 2}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32}}>
          <Revelar
            texto={PORTADA.etiquetas.join('  ·  ')}
            desde={6}
            paso={2}
            style={{
              fontFamily: FUENTE.mono,
              fontSize: 22,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: COLOR.tinta,
              whiteSpace: 'pre',
            }}
          />
          <Revelar
            texto="00"
            desde={10}
            style={{fontFamily: FUENTE.mono, fontSize: 22, color: COLOR.gris, letterSpacing: '0.04em'}}
          />
        </div>
        <div
          style={{
            marginTop: 20,
            height: 2,
            backgroundColor: COLOR.linea,
            scale: `${interpolate(frame, [4, 40], [0, 1], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} 1`,
            transformOrigin: 'left center',
          }}
        />
      </div>

      <Revelar
        texto={PORTADA.apoyo}
        desde={24}
        paso={2}
        style={{
          position: 'absolute',
          left: 1080,
          top: 196,
          width: 720,
          fontFamily: FUENTE.texto,
          fontWeight: 400,
          fontSize: 46,
          lineHeight: 1.22,
          letterSpacing: '-0.015em',
          color: COLOR.tinta,
        }}
      />

      {/* Se escribe con la pluma en ~2.6 s y despues baja la amplitud */}
      <TrazoLinea
        ancho={LIENZO.ancho}
        alto={LIENZO.alto}
        medio={540}
        amplitud={interpolate(frame, [2.4 * fps, durationInFrames], [118, 70], {
          easing: Easing.bezier(0.33, 1, 0.68, 1),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })}
        calmaDesde={0.6}
        fase={0.6 + frame * 0.012}
        hasta={interpolate(frame, [8, 2.6 * fps], [0, LIENZO.ancho], {
          easing: Easing.bezier(0.45, 0, 0.2, 1),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })}
        pluma
      />

      <Revelar
        texto={PORTADA.titulo}
        desde={34}
        duracion={34}
        style={{
          position: 'absolute',
          left: LIENZO.margen,
          top: 664,
          marginLeft: '-0.05em',
          fontFamily: FUENTE.display,
          fontWeight: 800,
          fontSize: 320,
          lineHeight: ALTO_LINEA_DISPLAY,
          letterSpacing: TRACKING_DISPLAY,
          color: COLOR.tinta,
        }}
      />
    </AbsoluteFill>
  );
};
