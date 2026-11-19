import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FUENTE} from '../fuentes';
import {ALTO_LINEA_DISPLAY, TRACKING_DISPLAY, useFuentesListas} from '../medidas';
import {CIERRE} from '../secciones';
import {COLOR, LIENZO} from '../tema';
import {Revelar} from './Revelar';
import {TrazoLinea} from './TrazoLinea';

/** 13 · Cierre: gracias, autor y enlace. El Trazo se aquieta hasta quedar plano. */
export const Cierre: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const listas = useFuentesListas();
  if (!listas) return null;

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.lienzo}}>
      <div style={{position: 'absolute', left: LIENZO.margen, top: 84, width: LIENZO.ancho - LIENZO.margen * 2}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32}}>
          <Revelar
            texto="Trazo  ·  Desarrollo Móvil 2"
            desde={4}
            paso={2}
            style={{fontFamily: FUENTE.mono, fontSize: 22, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLOR.tinta, whiteSpace: 'pre'}}
          />
          <Revelar texto="13" desde={8} style={{fontFamily: FUENTE.mono, fontSize: 22, color: COLOR.gris, letterSpacing: '0.04em'}} />
        </div>
        <div
          style={{
            marginTop: 20,
            height: 2,
            backgroundColor: COLOR.linea,
            scale: `${interpolate(frame, [2, 30], [0, 1], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} 1`,
            transformOrigin: 'left center',
          }}
        />
      </div>

      <Revelar
        texto={CIERRE.titulo}
        desde={12}
        duracion={32}
        style={{
          position: 'absolute',
          left: LIENZO.margen,
          top: 214,
          marginLeft: '-0.045em',
          fontFamily: FUENTE.display,
          fontWeight: 800,
          fontSize: 260,
          lineHeight: ALTO_LINEA_DISPLAY,
          letterSpacing: TRACKING_DISPLAY,
          color: COLOR.tinta,
        }}
      />

      {/* El Trazo, cada vez mas quieto */}
      <TrazoLinea
        ancho={LIENZO.ancho}
        alto={LIENZO.alto}
        medio={640}
        amplitud={interpolate(frame, [0, 5.5 * fps], [104, 0], {
          easing: Easing.bezier(0.33, 1, 0.68, 1),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })}
        calmaDesde={0.7}
        fase={0.6 + frame * 0.02}
        grosor={3}
      />

      <div style={{position: 'absolute', left: LIENZO.margen, top: 812, width: LIENZO.ancho - LIENZO.margen * 2}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <Revelar
            texto={CIERRE.autor}
            desde={40}
            paso={3}
            style={{fontFamily: FUENTE.texto, fontWeight: 500, fontSize: 48, letterSpacing: '-0.015em', color: COLOR.tinta}}
          />
          <Revelar
            texto={CIERRE.enlace}
            desde={52}
            style={{fontFamily: FUENTE.mono, fontWeight: 500, fontSize: 32, color: COLOR.acento}}
          />
        </div>
      </div>

      {/* Ultimo segundo: todo se va al lienzo */}
      <AbsoluteFill
        style={{
          backgroundColor: COLOR.lienzo,
          opacity: interpolate(frame, [durationInFrames - 1.2 * fps, durationInFrames - 0.2 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
    </AbsoluteFill>
  );
};
