import {Audio} from '@remotion/media';
import {interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/** Pad ambiental generado con scripts/musica.py. Entra en 2 s y sale en 3 s. */
export const Musica: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  return (
    <Audio
      name="Musica"
      src={staticFile('musica.wav')}
      volume={interpolate(frame, [0, 2 * fps, durationInFrames - 3 * fps, durationInFrames], [0, 0.35, 0.35, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })}
    />
  );
};
