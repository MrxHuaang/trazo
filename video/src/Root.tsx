import {Composition} from 'remotion';
import {calcularMetadatos} from './duraciones';
import {Trazo} from './Trazo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Trazo"
      component={Trazo}
      durationInFrames={6000}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{duraciones: []}}
      calculateMetadata={calcularMetadatos}
    />
  );
};
