import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FUENTE} from '../fuentes';
import {ALTO_LINEA_DISPLAY, TRACKING_DISPLAY, useFuentesListas} from '../medidas';
import {STACK} from '../secciones';
import {COLOR, LIENZO} from '../tema';
import {Revelar} from './Revelar';

const SALIDA = Easing.bezier(0.16, 1, 0.3, 1);

/** Escena 12: stack a la izquierda y tres cifras a la derecha. */
export const Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const listas = useFuentesListas();
  if (!listas) return null;

  const anchoLista = 760;
  const inicioLista = 40;

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.lienzo}}>
      {/* Cabecera */}
      <div style={{position: 'absolute', left: LIENZO.margen, top: 84, width: LIENZO.ancho - LIENZO.margen * 2}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32}}>
          <Revelar texto="12" desde={4} style={{fontFamily: FUENTE.mono, fontSize: 22, color: COLOR.tinta, letterSpacing: '0.04em'}} />
          <Revelar
            texto="Anexo técnico"
            desde={8}
            style={{fontFamily: FUENTE.mono, fontSize: 20, color: COLOR.gris, letterSpacing: '0.08em', textTransform: 'uppercase'}}
          />
        </div>
        <div
          style={{
            marginTop: 20,
            height: 2,
            backgroundColor: COLOR.linea,
            scale: `${interpolate(frame, [2, 30], [0, 1], {easing: SALIDA, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} 1`,
            transformOrigin: 'left center',
          }}
        />
      </div>

      <Revelar
        texto={STACK.titulo}
        desde={10}
        paso={4}
        duracion={30}
        style={{
          position: 'absolute',
          left: LIENZO.margen,
          top: 196,
          marginLeft: '-0.04em',
          fontFamily: FUENTE.display,
          fontWeight: 800,
          fontSize: 188,
          lineHeight: ALTO_LINEA_DISPLAY,
          letterSpacing: TRACKING_DISPLAY,
          color: COLOR.tinta,
          whiteSpace: 'pre',
        }}
      />
      <Revelar
        texto={STACK.apoyo}
        desde={24}
        paso={2}
        style={{
          position: 'absolute',
          left: LIENZO.margen,
          top: 404,
          fontFamily: FUENTE.texto,
          fontSize: 44,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          color: COLOR.gris,
        }}
      />

      {/* Cada fila entra 7 cuadros despues de la anterior */}
      <div style={{position: 'absolute', left: LIENZO.margen, top: 520, width: anchoLista}}>
        {STACK.lista.map((item, i) => {
          const d = inicioLista + i * 7;
          return (
            <div key={item} style={{position: 'relative', height: 60}}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: anchoLista,
                  height: 1,
                  backgroundColor: '#C9CCD3',
                  scale: `${interpolate(frame, [d, d + 20], [0, 1], {easing: SALIDA, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} 1`,
                  transformOrigin: 'left center',
                }}
              />
              <div style={{position: 'absolute', left: 0, top: 16, display: 'flex', gap: 36, alignItems: 'baseline'}}>
                <Revelar
                  texto={String(i + 1).padStart(2, '0')}
                  desde={d + 2}
                  style={{fontFamily: FUENTE.mono, fontSize: 18, color: COLOR.gris}}
                />
                <Revelar
                  texto={item}
                  desde={d + 4}
                  paso={1}
                  style={{fontFamily: FUENTE.mono, fontWeight: 500, fontSize: 28, color: COLOR.tinta, letterSpacing: '-0.01em'}}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cifras */}
      <div style={{position: 'absolute', left: 1000, top: 664, display: 'flex', gap: 72}}>
        {STACK.cifras.map((cifra, i) => {
          const d = 70 + i * 12;
          return (
            <div key={cifra.nombre} style={{minWidth: 200}}>
              <Revelar
                texto={cifra.valor}
                desde={d}
                duracion={30}
                style={{
                  fontFamily: FUENTE.display,
                  fontWeight: 800,
                  fontSize: 204,
                  whiteSpace: 'pre',
                  lineHeight: 0.86,
                  letterSpacing: '-0.06em',
                  color: i === 2 ? COLOR.acento : COLOR.tinta,
                  marginLeft: '-0.05em',
                }}
              />
              <div
                style={{
                  marginTop: 34,
                  height: 2,
                  width: 200,
                  backgroundColor: COLOR.tinta,
                  scale: `${interpolate(frame, [d + 8, d + 28], [0, 1], {easing: SALIDA, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} 1`,
                  transformOrigin: 'left center',
                }}
              />
              <Revelar
                texto={cifra.nombre}
                desde={d + 12}
                style={{marginTop: 18, fontFamily: FUENTE.mono, fontSize: 22, color: COLOR.gris, letterSpacing: '0.08em', textTransform: 'uppercase'}}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
