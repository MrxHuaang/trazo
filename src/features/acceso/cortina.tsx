import type { ReactNode } from 'react';
import { View } from 'react-native';

import { TraceLine } from '@/ui';

type CortinaProps = {
  /** Solo se anima mientras carga; la de privacidad va quieta. */
  animate?: boolean;
  children?: ReactNode;
};

/** Misma composición que la carga de la base de datos, para que no se note el cambio entre las dos. */
export function Cortina({ animate = true, children }: CortinaProps) {
  return (
    <View className="flex-1 justify-center gap-2 p-6" accessibilityLabel="Trazo">
      <TraceLine height={40} animate={animate} />
      {children}
    </View>
  );
}
