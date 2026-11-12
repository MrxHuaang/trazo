import type { ReactNode } from 'react';
import { View } from 'react-native';

import { TraceLine } from '@/ui';

type CortinaProps = {
  /** Anima el Trazo (carga). La cortina de privacidad va quieta. */
  animate?: boolean;
  children?: ReactNode;
};

/**
 * Lienzo neutro con el Trazo: tapa la app mientras carga el consultorio, mientras se redirige a la
 * bienvenida y cuando la app pasa a segundo plano (así el selector de apps no muestra datos).
 * Usa la misma composición que la carga de la base de datos para que no haya saltos.
 */
export function Cortina({ animate = true, children }: CortinaProps) {
  return (
    <View className="flex-1 justify-center gap-2 p-6" accessibilityLabel="Trazo">
      <TraceLine height={40} animate={animate} />
      {children}
    </View>
  );
}
