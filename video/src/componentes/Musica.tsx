import {Audio} from '@remotion/media';
import {interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/** La pista se genera con scripts/musica.py y ya viene normalizada a -18 dBFS. */
export const Musica: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  return (
    <Audio
      name="Musica"
      src={staticFile('musica.wav')}
      volume={interpolate(frame, [0, 2 * fps, durationInFrames - 3 * fps, durationInFrames], [0, 0.6, 0.6, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })}
    />
  );
};
