import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, Easing, interpolate, useVideoConfig} from 'remotion';
import {TrazoLinea} from './TrazoLinea';

type PropsBarrido = Record<string, never>;

const AVANCE = Easing.bezier(0.45, 0, 0.2, 1);

/**
 * Transicion firma: la pluma del sismografo cruza la pantalla de izquierda a derecha,
 * agitada al principio y en calma al llegar. Detras de la pluma aparece la escena nueva.
 */
const BarridoTrazoComponente: React.FC<TransitionPresentationComponentProps<PropsBarrido>> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const {width, height} = useVideoConfig();

  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const avance = AVANCE(presentationProgress);
  const pluma = avance * (width + 60);
  const desvanece = interpolate(presentationProgress, [0.78, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(0 ${Math.max(0, width - pluma)}px 0 0)`}}>{children}</AbsoluteFill>
      <TrazoLinea
        ancho={width}
        alto={height}
        medio={height / 2}
        amplitud={120}
        calmaDesde={0.82}
        fase={0.6}
        hasta={pluma}
        pluma
        opacidad={desvanece}
      />
    </AbsoluteFill>
  );
};

export const barridoTrazo = (): TransitionPresentation<PropsBarrido> => ({
  component: BarridoTrazoComponente,
  props: {},
});
