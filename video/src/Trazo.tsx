import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {barridoTrazo} from './componentes/BarridoTrazo';
import {Cierre} from './componentes/Cierre';
import {Musica} from './componentes/Musica';
import {Portada} from './componentes/Portada';
import {SeccionEscena} from './componentes/Seccion';
import {Stack} from './componentes/Stack';
import {cuadrosSeccion, type PropsTrazo} from './duraciones';
import {SECCIONES} from './secciones';
import {COLOR, TIEMPO} from './tema';

/**
 * Las secciones se generan desde secciones.ts y cada una dura lo que dure su grabacion.
 * Para cambiar textos o tiempos se toca secciones.ts o tema.ts, no este archivo.
 */
export const Trazo: React.FC<PropsTrazo> = ({duraciones}) => {
  const {fps} = useVideoConfig();
  const transicion = linearTiming({durationInFrames: Math.round(TIEMPO.transicion * fps)});

  return (
    <AbsoluteFill style={{backgroundColor: COLOR.lienzo}}>
      <TransitionSeries name="Secciones">
        <TransitionSeries.Sequence name="00 Portada" durationInFrames={Math.round(TIEMPO.portada * fps)}>
          <Portada />
        </TransitionSeries.Sequence>
        {SECCIONES.flatMap((seccion, i) => [
          <TransitionSeries.Transition key={`t-${seccion.numero}`} presentation={barridoTrazo()} timing={transicion} />,
          <TransitionSeries.Sequence
            key={`s-${seccion.numero}`}
            name={`${seccion.numero} ${seccion.titulo.replace('\n', ' ')}`}
            durationInFrames={cuadrosSeccion(duraciones[i] ?? null, fps)}
          >
            <SeccionEscena seccion={seccion} orden={i} total={SECCIONES.length} segundosClip={duraciones[i] ?? null} />
          </TransitionSeries.Sequence>,
        ])}
        <TransitionSeries.Transition presentation={barridoTrazo()} timing={transicion} />
        <TransitionSeries.Sequence name="12 Como esta hecho" durationInFrames={Math.round(TIEMPO.stack * fps)}>
          <Stack />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={barridoTrazo()} timing={transicion} />
        <TransitionSeries.Sequence name="13 Gracias" durationInFrames={Math.round(TIEMPO.cierre * fps)}>
          <Cierre />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Musica />
    </AbsoluteFill>
  );
};
